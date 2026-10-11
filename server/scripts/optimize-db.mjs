#!/usr/bin/env node
// Reduz o tamanho de server/spotify_api.db removendo indices que a aplicacao
// nao usa e compactando o arquivo (VACUUM).
//
// A aplicacao (server/services/spotifyService.js) consulta artistas por "id" e
// junta generos por "_rowid_"; portanto o indice "idx_artist_rowid" (sobre a
// coluna explicita "rowid", que a base pre-provisionada possui) e inutil e pode
// custar ~190 MB.
//
// Uso:
//   node scripts/optimize-db.mjs [caminho-do-db]

import { createHash } from "node:crypto";
import { createReadStream, statSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const arg = process.argv.slice(2).find((a) => !a.startsWith("-"));
const dbPath = arg || process.env.DB_PATH || join(__dirname, "..", "spotify_api.db");

function human(bytes) {
    const units = ["B", "KB", "MB", "GB"];
    let n = bytes;
    let i = 0;
    while (n >= 1024 && i < units.length - 1) {
        n /= 1024;
        i++;
    }
    return `${n.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function sha256OfFile(path) {
    return new Promise((resolve, reject) => {
        const hash = createHash("sha256");
        const stream = createReadStream(path);
        stream.on("data", (c) => hash.update(c));
        stream.on("error", reject);
        stream.on("end", () => resolve(hash.digest("hex")));
    });
}

function main() {
    const before = statSync(dbPath).size;
    console.log(`Banco: ${dbPath}`);
    console.log(`Antes: ${human(before)}`);

    const db = new DatabaseSync(dbPath);
    db.exec("DROP INDEX IF EXISTS idx_artist_rowid");
    console.log("Indice idx_artist_rowid removido (se existia).");

    console.time("VACUUM");
    db.exec("VACUUM");
    console.timeEnd("VACUUM");
    db.exec("PRAGMA optimize");

    const indexes = db
        .prepare("SELECT name FROM sqlite_master WHERE type = 'index' ORDER BY name")
        .all()
        .map((r) => r.name);
    const artists = db.prepare("SELECT count(*) n FROM artists").get().n;
    const genres = db.prepare("SELECT count(*) n FROM artist_genres").get().n;
    db.close();

    const after = statSync(dbPath).size;
    console.log(`Indices: ${indexes.join(", ")}`);
    console.log(`Linhas:  artists=${artists} artist_genres=${genres}`);
    console.log(`Depois: ${human(after)} (economia de ${human(before - after)})`);

    return sha256OfFile(dbPath).then((sha) => {
        console.log(`SHA-256: ${sha}`);
        console.log(`Bytes:   ${after}`);
        console.log("Atualize server/scripts/db.manifest.json com esses valores.");
    });
}

main().catch((err) => {
    console.error(`Erro: ${err.message}`);
    process.exit(1);
});
