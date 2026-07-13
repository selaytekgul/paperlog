import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://paperlog.net"),
  applicationName: "Paperlog",
  title: {
    default: "Paperlog — Papers and what people think about them",
    template: "%s · Paperlog",
  },
  description:
    "A social reading diary for research papers. Rate papers, leave reader notes, and discover what others are reading.",
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-32.png", type: "image/png", sizes: "32x32" },
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    shortcut: "/favicon.ico",
    apple: [{ url: "/apple-touch-icon.png", type: "image/png", sizes: "180x180" }],
  },
  appleWebApp: {
    capable: true,
    title: "Paperlog",
    statusBarStyle: "default",
  },
  openGraph: {
    type: "website",
    url: "https://paperlog.net/",
    locale: "en_US",
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
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  verification: {
    google: "Rph5oe1QGPGDaEewAffVrMKCJr_UuOxpCStqW7vE8BI",
  },
};

const websiteStructuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://paperlog.net/#website",
      name: "Paperlog",
      alternateName: "Paperlog research reading diary",
      url: "https://paperlog.net/",
      description:
        "A social reading diary for research papers, reader notes, ratings, and reproducibility experiences.",
      publisher: { "@id": "https://paperlog.net/#organization" },
    },
    {
      "@type": "Organization",
      "@id": "https://paperlog.net/#organization",
      name: "Paperlog",
      url: "https://paperlog.net/",
      logo: {
        "@type": "ImageObject",
        url: "https://paperlog.net/icon-512.png",
        width: 512,
        height: 512,
      },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteStructuredData).replace(/</g, "\\u003c"),
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
