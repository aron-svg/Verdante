import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard — Carbon-Aware Cloud Computing (MVP)",
  description: "Local-only hackathon mockup dashboard.",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
