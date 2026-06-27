import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Chaka Priority Atlas",
  description: "AI-powered natural restoration prioritization for Ethiopia.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
