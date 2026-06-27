interface RapLogoProps {
    className?: string;
}

/**
 * Rate a Prompt mark: two prompts split A | B, the winning side filled emerald.
 * Outline and the "A" inherit `currentColor`, so the mark flips with the theme.
 */
export function RapLogo({ className }: RapLogoProps) {
    return (
        <svg viewBox='0 0 64 64' fill='none' className={className} role='img' aria-label='Rate a Prompt'>
            <defs>
                <clipPath id='rap-logo-clip'>
                    <rect x='4' y='4' width='56' height='56' rx='16' />
                </clipPath>
            </defs>
            <g clipPath='url(#rap-logo-clip)'>
                <rect x='32' y='0' width='32' height='64' fill='#10b981' />
            </g>
            <rect x='4' y='4' width='56' height='56' rx='16' stroke='currentColor' strokeWidth='3.5' fill='none' />
            <text
                x='18'
                y='40'
                fontFamily='inherit'
                fontSize='22'
                fontWeight='700'
                textAnchor='middle'
                fill='currentColor'
            >
                A
            </text>
            <text x='46' y='40' fontFamily='inherit' fontSize='22' fontWeight='700' textAnchor='middle' fill='#ffffff'>
                B
            </text>
        </svg>
    );
}
