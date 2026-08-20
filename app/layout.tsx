import type { Metadata } from "next";
import VelourChat from "./components/VelourChat";
import "./globals.css";

export const metadata: Metadata = {
  title: "Velour — Make a living from what you love making",
  description: "Velour is the calmest way to launch, run, and scale your e-commerce store.",
  icons: { icon: "/favicon.svg" },
  openGraph: {
    title: "Velour — Your store. Ready before lunch.",
    description: "The calmest way to sell online.",
    images: ["/og.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Velour — Your store. Ready before lunch.",
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
        <link rel="icon" href="/favicon.svg" />
        <script
          async
          src="https://cdn.promotekit.com/pk.js"
          data-promotekit="74a9e110-f61e-487d-abae-0b56632481a7"
        />
      </head>
      <body>
        {children}
        <VelourChat />
      </body>
    </html>
  );
}
