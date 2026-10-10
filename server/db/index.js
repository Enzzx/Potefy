import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = dirname(fileURLToPath(import.meta.url));

const dbPath =
    process.env.DB_PATH ||
    join(currentDir, "..", "spotify_api.db");

const db = new DatabaseSync(dbPath);

// Garante que o schema exista mesmo em uma instalação nova.
// Em bases já existentes, o IF NOT EXISTS mantém tudo como está.
const schema = readFileSync(
    join(currentDir, "schema.sql"),
    "utf8"
);

db.exec(schema);

export default db;
