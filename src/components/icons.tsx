export const XavefLogo = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" {...props}>
        <g>
            <rect width="100" height="100" rx="12" ry="12" fill="currentColor" />
            <text x="50" y="70" fontSize="65" fill="hsl(var(--background))" textAnchor="middle" fontFamily="var(--font-share-tech), sans-serif" fontWeight="bold">
                X
            </text>
        </g>
    </svg>
);


export const XavefLogoText = (props: React.SVGProps<SVGTextElement>) => (
    <text x="0" y="15" fontFamily="serif" fontSize="24" fontWeight="bold" fill="currentColor" {...props}>
        Xavef
    </text>
);
