import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MLBB 5v5 Tournament — Fan Vote",
  description: "Cast your vote for the standout player of the tournament.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
