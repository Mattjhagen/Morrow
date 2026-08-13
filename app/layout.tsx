import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Morrow — Make a living from what you love making",
  description: "Morrow is the calmest way to launch and run your store.",
  icons: { icon: "/favicon.svg" },
  openGraph: {
    title: "Morrow — Your store. Ready before lunch.",
    description: "The calmest way to sell online.",
    images: ["/og.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Morrow — Your store. Ready before lunch.",
    description: "The calmest way to sell online.",
    images: ["/og.png"],
  },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <script
          async
          src="https://cdn.promotekit.com/pk.js"
          data-promotekit="74a9e110-f61e-487d-abae-0b56632481a7"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
