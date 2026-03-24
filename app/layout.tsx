import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Busha Phishing Awareness Course",
  description:
    "Interactive phishing awareness training with a scored assessment, email notifications, and a simple admin dashboard."
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
