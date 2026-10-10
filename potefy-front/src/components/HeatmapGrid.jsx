import { Fragment, useState } from "react";

import Chip from "./Chip";

function backgroundColor(count, max) {
    if (!count || max <= 0) {
        return "rgba(39,39,42,0.35)";
    }

    const ratio = count / max;

    const alpha = 0.15 + ratio * 0.7;

    return `rgba(29,185,84,${alpha.toFixed(3)})`;
}

export default function HeatmapGrid({
    playlists,
    overlap
}) {
    const [selected, setSelected] =
        useState(null);

    if (
        !playlists ||
        playlists.length < 2
    ) {
        return (
            <p className="text-sm text-zinc-500">
                Selecione ao menos duas
                playlists para comparar.
            </p>
        );
    }

    const pairByKey = new Map();

    let max = 0;

    for (const pair of overlap) {
        pairByKey.set(
            `${pair.playlistA.id}|${pair.playlistB.id}`,
            pair
        );

        if (pair.repeatedCount > max) {
            max = pair.repeatedCount;
        }
    }

    const findPair = (a, b) =>
        pairByKey.get(`${a}|${b}`) ||
        pairByKey.get(`${b}|${a}`) ||
        null;

    const selectedPair = selected
        ? findPair(selected.a, selected.b)
        : null;

    const gridTemplateColumns = `minmax(7rem, auto) repeat(${playlists.length}, minmax(2.75rem, 1fr))`;

    return (
        <div>
            <div className="overflow-x-auto pb-1">
                <div
                    className="inline-grid gap-1"
                    style={{
                        gridTemplateColumns
                    }}
                >
                    <div />

                    {playlists.map(
                        (playlist) => (
                            <div
                                key={
                                    playlist.id
                                }
                                title={
                                    playlist.name
                                }
                                className="
                                    h-8
                                    px-1
                                    flex items-center
                                    justify-center
                                    text-[10px]
                                    leading-tight
                                    text-zinc-500
                                    text-center
                                    overflow-hidden
                                "
                            >
                                <span className="truncate">
                                    {
                                        playlist.name
                                    }
                                </span>
                            </div>
                        )
                    )}

                    {playlists.map((row) => (
                        <Fragment key={row.id}>
                            <div
                                title={row.name}
                                className="
                                    max-w-[9rem]
                                    pr-2
                                    flex items-center
                                    text-xs
                                    text-zinc-400
                                    truncate
                                "
                            >
                                {row.name}
                            </div>

                            {playlists.map(
                                (col) => {
                                    if (
                                        row.id ===
                                        col.id
                                    ) {
                                        return (
                                            <div
                                                key={
                                                    col.id
                                                }
                                                className="
                                                    h-9
                                                    rounded
                                                    bg-zinc-800/50
                                                "
                                            />
                                        );
                                    }

                                    const pair =
                                        findPair(
                                            row.id,
                                            col.id
                                        );

                                    const count =
                                        pair?.repeatedCount ??
                                        0;

                                    const isSelected =
                                        selected &&
                                        ((selected.a ===
                                            row.id &&
                                            selected.b ===
                                                col.id) ||
                                            (selected.a ===
                                                col.id &&
                                                selected.b ===
                                                    row.id));

                                    return (
                                        <button
                                            key={
                                                col.id
                                            }
                                            onClick={() =>
                                                setSelected(
                                                    {
                                                        a: row.id,
                                                        b: col.id
                                                    }
                                                )
                                            }
                                            style={{
                                                backgroundColor:
                                                    backgroundColor(
                                                        count,
                                                        max
                                                    )
                                            }}
                                            title={`${row.name} × ${col.name}: ${count}`}
                                            className={`
                                                h-9
                                                rounded
                                                flex items-center
                                                justify-center
                                                text-xs
                                                font-medium
                                                text-white
                                                transition-transform
                                                hover:scale-[1.03]
                                                ${
                                                    isSelected
                                                        ? "ring-2 ring-[#1DB954]"
                                                        : ""
                                                }
                                            `}
                                        >
                                            {count > 0
                                                ? count
                                                : ""}
                                        </button>
                                    );
                                }
                            )}
                        </Fragment>
                    ))}
                </div>
            </div>

            <div className="
                mt-3
                flex items-center
                gap-2
                text-[10px]
                text-zinc-500
            ">
                <span>
                    menos em comum
                </span>

                <div className="flex gap-0.5">
                    {[
                        0.15, 0.35, 0.55,
                        0.75, 0.9
                    ].map((alpha) => (
                        <span
                            key={alpha}
                            className="
                                w-3 h-3
                                rounded-sm
                            "
                            style={{
                                backgroundColor:
                                    `rgba(29,185,84,${alpha})`
                            }}
                        />
                    ))}
                </div>

                <span>mais</span>

                {max > 0 && (
                    <span className="ml-auto">
                        máx: {max}
                    </span>
                )}
            </div>

            {selectedPair &&
                selectedPair
                    .repeatedTracks
                    .length > 0 && (
                    <div className="
                        mt-4
                        rounded-lg
                        border border-zinc-800
                        bg-[#141414]
                        p-4
                    ">
                        <div className="flex items-center gap-2 mb-3">
                            <Chip
                                label={
                                    selectedPair
                                        .playlistA
                                        .name
                                }
                                id={
                                    selectedPair
                                        .playlistA
                                        .id
                                }
                            />

                            <span className="text-zinc-500 text-xs">
                                ×
                            </span>

                            <Chip
                                label={
                                    selectedPair
                                        .playlistB
                                        .name
                                }
                                id={
                                    selectedPair
                                        .playlistB
                                        .id
                                }
                            />

                            <span className="text-xs text-zinc-500 ml-auto">
                                {
                                    selectedPair.repeatedCount
                                }{" "}
                                em comum
                            </span>
                        </div>

                        <ul className="space-y-1.5">
                            {selectedPair.repeatedTracks.map(
                                (track) => (
                                    <li
                                        key={
                                            track.id
                                        }
                                        className="
                                            text-sm
                                            text-zinc-300
                                            truncate
                                        "
                                    >
                                        {
                                            track.name
                                        }

                                        <span className="text-zinc-500">
                                            {" — "}
                                            {track.artists
                                                .map(
                                                    (
                                                        artist
                                                    ) =>
                                                        artist.name
                                                )
                                                .join(
                                                    ", "
                                                )}
                                        </span>
                                    </li>
                                )
                            )}
                        </ul>
                    </div>
                )}
        </div>
    );
}
