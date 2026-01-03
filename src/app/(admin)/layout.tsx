// This file is intentionally left simple.
// The main layout logic is handled by src/app/(app)/layout.tsx,
// which correctly applies the necessary AuthGuard and UI shell.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
