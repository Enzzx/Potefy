import { useState } from "react";

export default function ExpandableList({
    items,
    renderItem,
    initialCount = 10,
    step = 10,
    emptyMessage
}) {
    const [visible, setVisible] =
        useState(initialCount);

    if (!items || items.length === 0) {
        return emptyMessage ? (
            <p className="text-sm text-zinc-500">
                {emptyMessage}
            </p>
        ) : null;
    }

    const shown = items.slice(0, visible);

    const hasMore = visible < items.length;

    return (
        <div>
            <div className="space-y-3">
                {shown.map((item, index) =>
                    renderItem(item, index)
                )}
            </div>

            {(hasMore ||
                visible > initialCount) && (
                <button
                    onClick={() =>
                        setVisible(
                            hasMore
                                ? Math.min(
                                    visible + step,
                                    items.length
                                )
                                : initialCount
                        )
                    }
                    className="
                        mt-4
                        text-sm
                        text-[#1DB954]
                        hover:underline
                    "
                >
                    {hasMore
                        ? `Ver mais (${
                            items.length -
                            visible
                        })`
                        : "Ver menos"}
                </button>
            )}
        </div>
    );
}
