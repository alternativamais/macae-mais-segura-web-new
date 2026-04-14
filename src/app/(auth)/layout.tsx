import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Autenticação - Hórus Core",
  description: "Login para acesso ao Hórus Core",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  );
}
