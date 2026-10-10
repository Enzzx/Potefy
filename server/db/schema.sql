-- Schema de cache de artistas/gêneros.
-- Idempotente: pode ser executado a cada inicialização do servidor.
--
-- Observação: a base grande (pré-provisionada) pode conter uma coluna
-- explícita chamada "rowid". Por isso o código sempre referencia o rowid
-- interno via "_rowid_" em vez de "rowid".
-- Em uma base nova as tabelas usam o rowid implícito normalmente.

CREATE TABLE IF NOT EXISTS artists (
    id VARCHAR PRIMARY KEY,
    fetched_at BIGINT,
    name VARCHAR,
    followers_total BIGINT,
    popularity BIGINT
);

CREATE TABLE IF NOT EXISTS artist_genres (
    artist_rowid BIGINT,
    genre VARCHAR
);

CREATE INDEX IF NOT EXISTS idx_artist_genre_id
    ON artist_genres (artist_rowid);

CREATE INDEX IF NOT EXISTS idx_artist_id
    ON artists (id);
