#!/usr/bin/env python3
"""Reconstroi server/spotify_api.db a partir do dataset do Kaggle.

Fonte
-----
lordpatil/spotify-metadata-by-annas-archive  (Anna's Archive Spotify 2025-07)
Tabelas usadas: ``artists`` e ``artist_genres``.

O dataset completo tem ~190 GB. Este script baixa *apenas* os arquivos das duas
tabelas necessarias (parquet) pela API do Kaggle, nunca o dataset inteiro.

Pre-requisitos
--------------
    pip install kaggle pyarrow
    ~/.kaggle/kaggle.json        (token da API do Kaggle)

Uso
---
    python scripts/build-db.py
    python scripts/build-db.py --out server/spotify_api.db
    python scripts/build-db.py --list                       # so lista os arquivos
    python scripts/build-db.py --from-sqlite spotify_clean.sqlite3

Ao final imprime o SHA-256 e o tamanho, para colar em ``scripts/db.manifest.json``.
"""

from __future__ import annotations

import argparse
import hashlib
import sqlite3
import sys
import tempfile
from pathlib import Path

DATASET = "lordpatil/spotify-metadata-by-annas-archive"

# Colunas do banco final (a base pre-provisionada tem, alem destas, uma coluna
# explicita "rowid"; ela e irrelevante porque a aplicacao usa "_rowid_", que e
# o rowid interno. Aqui definimos o rowid interno explicitamente na insercao.)
ARTIST_COLS = ["id", "fetched_at", "name", "followers_total", "popularity"]
GENRE_COLS = ["artist_rowid", "genre"]

SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS artists (
    id VARCHAR,
    fetched_at BIGINT,
    name VARCHAR,
    followers_total BIGINT,
    popularity BIGINT
);
CREATE TABLE IF NOT EXISTS artist_genres (
    artist_rowid BIGINT,
    genre VARCHAR
);
"""

INDEX_SQL = """
CREATE INDEX IF NOT EXISTS idx_artist_id ON artists (id);
CREATE INDEX IF NOT EXISTS idx_artist_genre_id ON artist_genres (artist_rowid);
"""


def human(n: float) -> str:
    units = ["B", "KB", "MB", "GB", "TB"]
    i = 0
    while n >= 1024 and i < len(units) - 1:
        n /= 1024
        i += 1
    return f"{n:.1f} {units[i]}"


def sha256_of(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as fh:
        for chunk in iter(lambda: fh.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


# --------------------------------------------------------------------------- #
# Kaggle
# --------------------------------------------------------------------------- #
def kaggle_api():
    try:
        from kaggle.api.kaggle_api_extended import KaggleApi
    except ImportError:
        sys.exit("Faltou a lib 'kaggle'. Rode: pip install kaggle pyarrow")
    api = KaggleApi()
    api.authenticate()
    return api


def remote_files(api) -> list[str]:
    res = api.dataset_list_files(DATASET)
    return [f.name for f in res.files]


def pick_file(names: list[str], table: str) -> str:
    """Escolhe o arquivo da tabela, preferindo .parquet sobre .csv."""
    base = Path(table).name
    for ext in (".parquet", ".csv"):
        for n in names:
            if Path(n).name == base + ext:
                return n
    # Fallback: qualquer coisa comecando com o nome da tabela
    for ext in (".parquet", ".csv"):
        for n in names:
            if Path(n).name.startswith(base) and n.endswith(ext):
                return n
    sys.exit(
        f"Nao encontrei arquivo para a tabela '{table}' no dataset.\n"
        f"Arquivos disponiveis: {names}"
    )


def download(api, file_name: str, workdir: Path) -> Path:
    print(f"Baixando {file_name} ...")
    api.dataset_download_file(DATASET, file_name, path=str(workdir), force=True, quiet=False)
    # O arquivo fica em workdir/<basename>; se vier zipado, o kaggle extrai.
    candidate = workdir / Path(file_name).name
    if not candidate.exists():
        hits = list(workdir.glob(f"**/{Path(file_name).stem}*"))
        if hits:
            candidate = hits[0]
    if not candidate.exists():
        sys.exit(f"Download de {file_name} nao gerou arquivo em {workdir}")
    return candidate


# --------------------------------------------------------------------------- #
# Construcao do banco
# --------------------------------------------------------------------------- #
def new_db(db_path: Path) -> sqlite3.Connection:
    if db_path.exists():
        db_path.unlink()
    conn = sqlite3.connect(str(db_path))
    conn.executescript("PRAGMA journal_mode=OFF; PRAGMA synchronous=OFF;")
    conn.executescript(SCHEMA_SQL)
    return conn


def _pick(columns: list[str], *alts: str):
    for a in alts:
        if a in columns:
            return a
    return None


def load_artists_parquet(conn: sqlite3.Connection, path: Path) -> int:
    import pyarrow.parquet as pq

    pf = pq.ParquetFile(path)
    cols = pf.schema.names
    c_rowid = _pick(cols, "rowid", "row_id")
    c_id = _pick(cols, "id")
    if c_id is None:
        sys.exit(f"Arquivo {path.name} nao tem coluna 'id'. Colunas: {cols}")
    c_fetched = _pick(cols, "fetched_at")
    c_name = _pick(cols, "name")
    c_followers = _pick(cols, "followers_total", "followers")
    c_pop = _pick(cols, "popularity")

    select_cols = [c for c in (c_rowid, c_id, c_fetched, c_name, c_followers, c_pop) if c]
    insert = "INSERT INTO artists (rowid, id, fetched_at, name, followers_total, popularity) VALUES (?,?,?,?,?,?)"

    total = 0
    next_rowid = 1
    for batch in pf.iter_batches(batch_size=200_000, columns=select_cols):
        d = batch.to_pydict()
        n = len(d[c_id])
        rows = []
        for i in range(n):
            if c_rowid is not None:
                rid = d[c_rowid][i]
            else:
                rid = next_rowid + i
            rows.append(
                (
                    rid,
                    d[c_id][i],
                    d[c_fetched][i] if c_fetched else None,
                    d[c_name][i] if c_name else None,
                    d[c_followers][i] if c_followers else 0,
                    d[c_pop][i] if c_pop else 0,
                )
            )
        conn.executemany(insert, rows)
        total += n
        next_rowid += n
        print(f"\r  artists: {total:,} linhas", end="", flush=True)
    print()
    return total


def load_genres_parquet(conn: sqlite3.Connection, path: Path) -> int:
    import pyarrow.parquet as pq

    pf = pq.ParquetFile(path)
    cols = pf.schema.names
    c_artist = _pick(cols, "artist_rowid", "artist_id")
    c_genre = _pick(cols, "genre")
    if c_artist is None or c_genre is None:
        sys.exit(f"Arquivo {path.name} nao tem as colunas esperadas. Colunas: {cols}")

    insert = "INSERT INTO artist_genres (artist_rowid, genre) VALUES (?,?)"
    total = 0
    for batch in pf.iter_batches(batch_size=200_000, columns=[c_artist, c_genre]):
        d = batch.to_pydict()
        rows = list(zip(d[c_artist], d[c_genre]))
        conn.executemany(insert, rows)
        total += len(rows)
        print(f"\r  artist_genres: {total:,} linhas", end="", flush=True)
    print()
    return total


def load_from_sqlite(conn: sqlite3.Connection, src_path: Path) -> None:
    """Copia as tabelas de um spotify_clean.sqlite3 local (via torrent)."""
    print(f"Copiando de {src_path} ...")
    conn.execute("ATTACH DATABASE ? AS src", (str(src_path),))
    conn.execute(
        "INSERT INTO artists (rowid, id, fetched_at, name, followers_total, popularity) "
        "SELECT rowid, id, fetched_at, name, followers_total, popularity FROM src.artists"
    )
    conn.execute(
        "INSERT INTO artist_genres (artist_rowid, genre) "
        "SELECT artist_rowid, genre FROM src.artist_genres"
    )
    conn.execute("DETACH DATABASE src")


def build(out: Path, workdir: Path, from_sqlite: Path | None, keep: bool) -> None:
    conn = new_db(out)
    try:
        if from_sqlite is not None:
            load_from_sqlite(conn, from_sqlite)
            conn.commit()
        else:
            api = kaggle_api()
            names = remote_files(api)
            artists_file = download(api, pick_file(names, "artists"), workdir)
            genres_file = download(api, pick_file(names, "artist_genres"), workdir)
            load_artists_parquet(conn, artists_file)
            conn.commit()
            load_genres_parquet(conn, genres_file)
            conn.commit()
            if not keep:
                artists_file.unlink(missing_ok=True)
                genres_file.unlink(missing_ok=True)

        print("Criando indices e compactando (VACUUM)...")
        conn.executescript(INDEX_SQL)
        conn.commit()
        conn.execute("VACUUM")
        conn.execute("PRAGMA optimize")
        conn.commit()

        artists = conn.execute("SELECT count(*) FROM artists").fetchone()[0]
        genres = conn.execute("SELECT count(*) FROM artist_genres").fetchone()[0]
        orphans = conn.execute(
            "SELECT count(*) FROM artist_genres g "
            "WHERE NOT EXISTS (SELECT 1 FROM artists a WHERE a._rowid_ = g.artist_rowid)"
        ).fetchone()[0]
        print(f"artists={artists:,}  artist_genres={genres:,}  orfaos={orphans:,}")
    finally:
        conn.close()

    print(f"\nBanco:   {out} ({human(out.stat().st_size)})")
    print(f"SHA-256: {sha256_of(out)}")
    print(f"Bytes:   {out.stat().st_size}")
    print("Atualize scripts/db.manifest.json com o SHA-256 se for publicar.")


def main() -> None:
    here = Path(__file__).resolve().parent
    parser = argparse.ArgumentParser(description="Reconstroi o spotify_api.db a partir do Kaggle.")
    parser.add_argument("--out", type=Path, default=here.parent / "spotify_api.db")
    parser.add_argument("--from-sqlite", type=Path, default=None, help="usa um spotify_clean.sqlite3 local")
    parser.add_argument("--keep", action="store_true", help="nao apaga os arquivos baixados")
    parser.add_argument("--list", action="store_true", help="apenas lista os arquivos do dataset")
    args = parser.parse_args()

    if args.list:
        for n in remote_files(kaggle_api()):
            print(n)
        return

    if args.from_sqlite is not None and not args.from_sqlite.exists():
        sys.exit(f"Arquivo nao encontrado: {args.from_sqlite}")

    workdir = Path(tempfile.mkdtemp(prefix="potefy-db-"))
    print(f"Diretorio de trabalho: {workdir}")
    build(args.out, workdir, args.from_sqlite, args.keep)


if __name__ == "__main__":
    main()
