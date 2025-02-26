interface IconProps {
    strokeWidth?: number
    color?: string
}

export const CartIcon = ({ strokeWidth, color }: IconProps) => (
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
        className="icon icon-tabler icons-tabler-outline icon-tabler-shopping-cart"
    >
        <path stroke="none" d="M0 0h24v24H0z" />
        <path d="M4 19a2 2 0 1 0 4 0 2 2 0 1 0-4 0M15 19a2 2 0 1 0 4 0 2 2 0 1 0-4 0" />
        <path d="M17 17H6V3H4" />
        <path d="m6 5 14 1-1 7H6" />
    </svg>
)
