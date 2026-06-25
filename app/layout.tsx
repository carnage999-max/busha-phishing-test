import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  manifest: "/manifest.webmanifest",
  title: "Busha Phishing Awareness Course",
  description:
    "Interactive phishing awareness training with a scored assessment, email notifications, and a simple admin dashboard.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: ["/favicon.ico"],
  },
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
