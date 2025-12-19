import Image from 'next/image';

export const XavefLogo = (props: Omit<React.ComponentProps<typeof Image>, 'src' | 'alt'>) => (
  <Image src="/logo.png" alt="Xavef Financials Logo" width={64} height={64} {...props} />
);

export const XavefLogoText = (props: Omit<React.ComponentProps<"div">, "children">) => (
    <div {...props}>
        <Image
            src="/logo.png"
            alt="Xavef Financials"
            width={120}
            height={30}
            className="h-8 w-auto"
        />
    </div>
);