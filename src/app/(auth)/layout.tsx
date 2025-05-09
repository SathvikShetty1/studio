import { Logo } from '@/components/common/logo';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-secondary p-4">
      <div className="mb-8">
        <Logo iconSize={36} textSize="text-3xl" />
      </div>
      <main className="w-full max-w-md">
        {children}
      </main>
      <footer className="mt-8 text-center text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} Complaint Central. All rights reserved.
      </footer>
    </div>
  );
}
