interface IconProps {
    strokeWidth?: number
    color?: string
}

export const OfferIcon = ({ strokeWidth, color }: IconProps) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={24}
        height={24}
        fill="none"
        viewBox="0 0 24 24"
        stroke={color || "currentColor"}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={strokeWidth || 2}
        className="icon icon-tabler icons-tabler-outline icon-tabler-search"
    >
        <path stroke="none" d="M0 0h24v24H0z" />
        <path d="m9 15 6-6" />
        <circle cx={9.5} cy={9.5} r={0.5} fill={color || "currentColor"} />
        <circle cx={14.5} cy={14.5} r={0.5} fill={color || "currentColor"} />
        <path d="M5 7.2A2.2 2.2 0 0 1 7.2 5h1a2.2 2.2 0 0 0 1.55-.64l.7-.7a2.2 2.2 0 0 1 3.12 0l.7.7a2.2 2.2 0 0 0 1.55.64h1a2.2 2.2 0 0 1 2.2 2.2v1a2.2 2.2 0 0 0 .64 1.55l.7.7a2.2 2.2 0 0 1 0 3.12l-.7.7a2.2 2.2 0 0 0-.64 1.55v1a2.2 2.2 0 0 1-2.2 2.2h-1a2.2 2.2 0 0 0-1.55.64l-.7.7a2.2 2.2 0 0 1-3.12 0l-.7-.7a2.2 2.2 0 0 0-1.55-.64h-1a2.2 2.2 0 0 1-2.2-2.2v-1a2.2 2.2 0 0 0-.64-1.55l-.7-.7a2.2 2.2 0 0 1 0-3.12l.7-.7A2.2 2.2 0 0 0 5 8.2v-1" />
    </svg>
)