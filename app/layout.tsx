import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://paperlog.net"),
  title: {
    default: "Paperlog — Papers and what people think about them",
    template: "%s · Paperlog",
  },
  description:
    "A social reading diary for research papers. Rate papers, leave reader notes, and discover what others are reading.",
  openGraph: {
    type: "website",
    siteName: "Paperlog",
    title: "Paperlog — Papers and what people think about them",
    description: "A social reading diary for research papers.",
    images: [{ url: "/og.png", width: 1731, height: 908, alt: "Paperlog — Papers and what people think about them" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Paperlog — Papers and what people think about them",
    description: "A social reading diary for research papers.",
    images: ["/og.png"],
  },
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
