#!/usr/bin/env node
// Baixa o banco de metadados (server/spotify_api.db) a partir de um asset de
// Release do GitHub e valida o SHA-256. Sem dependencias (Node >= 22).
//
// Uso:
//   node scripts/fetch-db.mjs           # baixa se estiver ausente/incorreto
//   node scripts/fetch-db.mjs --force   # baixa novamente sempre
//
// Overrides por variavel de ambiente:
//   DB_URL, DB_SHA256, DB_PATH

import { createHash } from "node:crypto";
import { createReadStream, createWriteStream, existsSync, readFileSync, renameSync, statSync, unlinkSync } from "node:fs";
import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const serverDir = join(__dirname, "..");
const manifestPath = join(__dirname, "db.manifest.json");

function loadManifest() {
    try {
        return JSON.parse(readFileSync(manifestPath, "utf8"));
    } catch {
        return {};
    }
}

const manifest = loadManifest();
const url = process.env.DB_URL || manifest.url;
const expectedSha = (process.env.DB_SHA256 || manifest.sha256 || "").toLowerCase();
const target = process.env.DB_PATH || join(serverDir, "spotify_api.db");
const force = process.argv.includes("--force");

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

async function main() {
    if (!url) {
        console.error("Nenhuma URL definida. Preencha server/scripts/db.manifest.json ou use DB_URL=...");
        process.exit(1);
    }

    if (!force && existsSync(target)) {
        const stat = statSync(target);
        if (manifest.sizeBytes && stat.size !== manifest.sizeBytes) {
            console.log(`Banco existente com tamanho diferente (${human(stat.size)} != ${human(manifest.sizeBytes)}).`);
        } else if (!expectedSha) {
            console.log(`Banco ja existe em ${target} (${human(stat.size)}). Nada a fazer.`);
            return;
        } else {
            console.log("Validando banco existente...");
            const got = (await sha256OfFile(target)).toLowerCase();
            if (got === expectedSha) {
                console.log(`Banco ok em ${target} (${human(stat.size)}). Nada a fazer.`);
                return;
            }
            console.log("SHA-256 nao confere; baixando novamente.");
        }
    }

    const partPath = `${target}.part`;
    if (existsSync(partPath)) unlinkSync(partPath);

    console.log(`Baixando ${url}`);
    const res = await fetch(url, { redirect: "follow" });
    if (!res.ok || !res.body) {
        throw new Error(`Falha no download: HTTP ${res.status} ${res.statusText}`);
    }

    const total = Number(res.headers.get("content-length")) || 0;
    const hash = createHash("sha256");
    let received = 0;
    let lastLog = 0;

    const meter = new Transform({
        transform(chunk, _enc, cb) {
            hash.update(chunk);
            received += chunk.length;
            const now = Date.now();
            if (now - lastLog > 1500) {
                lastLog = now;
                if (total) {
                    const pct = ((received / total) * 100).toFixed(1);
                    process.stdout.write(`\r  ${human(received)} / ${human(total)} (${pct}%)`);
                } else {
                    process.stdout.write(`\r  ${human(received)}`);
                }
            }
            cb(null, chunk);
        }
    });

    await pipeline(Readable.fromWeb(res.body), meter, createWriteStream(partPath));
    process.stdout.write("\n");

    const got = hash.digest("hex").toLowerCase();
    if (expectedSha && got !== expectedSha) {
        unlinkSync(partPath);
        throw new Error(`SHA-256 nao confere.\n  esperado: ${expectedSha}\n  obtido:   ${got}`);
    }
    if (!expectedSha) {
        console.warn(`AVISO: sem SHA-256 esperado no manifest. Hash obtido: ${got}`);
    }

    renameSync(partPath, target);
    console.log(`Pronto: ${target} (${human(statSync(target).size)})`);
}

main().catch((err) => {
    console.error(`\nErro: ${err.message}`);
    process.exit(1);
});
