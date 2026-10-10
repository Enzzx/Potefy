import { useState } from "react";

export default function Collapsible({
    header,
    children,
    defaultOpen = false,
    selected = false,
    onToggleSelect,
    selectLabel = "Selecionar"
}) {
    const [open, setOpen] =
        useState(defaultOpen);

    return (
        <div className="border-b border-zinc-800">
            <div className="flex items-center gap-3">
                {onToggleSelect && (
                    <button
                        onClick={onToggleSelect}
                        aria-label={selectLabel}
                        title={selectLabel}
                        className={`
                            shrink-0
                            w-5 h-5
                            rounded-full
                            border
                            flex items-center
                            justify-center
                            text-[11px]
                            transition-colors
                            ${
                                selected
                                    ? "bg-[#1DB954] border-[#1DB954] text-black"
                                    : "border-zinc-600 text-transparent hover:border-zinc-400"
                            }
                        `}
                    >
                        ✓
                    </button>
                )}

                <button
                    onClick={() =>
                        setOpen(
                            (value) => !value
                        )
                    }
                    className="
                        flex-1 min-w-0
                        flex items-center
                        justify-between
                        gap-3
                        py-3
                        text-left
                        hover:opacity-90
                        transition-opacity
                    "
                >
                    <div className="min-w-0 flex-1">
                        {header}
                    </div>

                    <span
                        className={`
                            text-zinc-500
                            transition-transform
                            ${
                                open
                                    ? "rotate-180"
                                    : ""
                            }
                        `}
                    >
                        ▾
                    </span>
                </button>
            </div>

            {open && (
                <div
                    className={`
                        pb-4
                        ${
                            onToggleSelect
                                ? "pl-8"
                                : ""
                        }
                    `}
                >
                    {children}
                </div>
            )}
        </div>
    );
}
