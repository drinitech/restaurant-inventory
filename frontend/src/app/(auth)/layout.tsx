export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,var(--accent),var(--background)_60%)] px-4">
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
