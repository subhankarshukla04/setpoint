import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SETPOINT™",
  description: "Operator's manual for a 12-week cut. KB-grounded.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "SETPOINT" },
};

export const viewport: Viewport = {
  themeColor: "#0E0E0C",
  width: "device-width", initialScale: 1, maximumScale: 1,
  userScalable: false, viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (<html lang="en"><body className="font-sans">{children}</body></html>);
}
