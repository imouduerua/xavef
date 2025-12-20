import { Shield } from 'lucide-react';

export const XavefLogo = (props: React.ComponentProps<typeof Shield>) => (
  <Shield {...props} />
);

export const XavefLogoText = (
  props: Omit<React.ComponentProps<'div'>, 'children'>
) => (
  <div {...props} className="flex items-center gap-2">
    <Shield className="h-8 w-8" />
    <span className="text-xl font-bold">XAVEF</span>
  </div>
);
