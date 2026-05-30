import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TwinCart — Find the twin. Pay the smart price.",
  description:
    "TwinCart finds the same product — or its smartest cheaper twin — across Amazon, Temu, SHEIN, Walmart & Target, and proves why they're equivalent. UCP-compatible, AP2-signed agentic checkout.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
