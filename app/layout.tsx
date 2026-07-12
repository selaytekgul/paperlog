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
  "@type": "WebSite",
  name: "Paperlog",
  alternateName: "Paperlog research reading diary",
  url: "https://paperlog.net/",
  description:
    "A social reading diary for research papers, reader notes, ratings, and reproducibility experiences.",
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
