interface IconProps {
    path: string
    size?: number
    strokeWidth?: number
    color?: string
}

export const CustomSimpleIcon = ({ size, strokeWidth, color, path }: IconProps) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size || 24}
        height={size || 24}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color || "currentColor"}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={strokeWidth || 2}
        className="icon icon-tabler icons-tabler-outline icon-tabler-search"
    >
        <path stroke="none" d="M0 0h24v24H0z" />
        <path d={path} />
    </svg>
)