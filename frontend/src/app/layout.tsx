import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Analytics } from "@vercel/analytics/next";

const GA_ID = "G-NL34HHKD96";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Undervolt - Austin Energy Infrastructure Analytics",
  description: "AI-powered platform analyzing 2.34M Austin construction permits to uncover grid infrastructure gaps. Built with NVIDIA RAPIDS, Ollama, and deployed on Jetson AGX Orin. 1st Place Winner - NVIDIA DGX AITX Hackathon.",
  keywords: ["NVIDIA", "DGX Spark", "RAPIDS", "Ollama", "Austin", "energy", "infrastructure", "permits", "AI", "GPU", "Jetson", "hackathon"],
  authors: [{ name: "Undervolt Team" }],
  openGraph: {
    title: "Undervolt - Austin Energy Infrastructure Analytics",
    description: "1st Place NVIDIA DGX AITX Hackathon | Analyzing 2.34M permits with GPU-accelerated AI to reveal Austin grid gaps. Built on NVIDIA RAPIDS and Jetson AGX Orin.",
    url: "https://undervolt-atx.vercel.app",
    siteName: "Undervolt",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "https://undervolt-atx.vercel.app/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Undervolt - Austin Energy Infrastructure Analytics"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Undervolt - Austin Energy Infrastructure Analytics",
    description: "1st Place NVIDIA DGX AITX Hackathon | 2.34M permits analyzed with GPU-accelerated AI",
    images: ["https://undervolt-atx.vercel.app/opengraph-image"]
  },
  robots: {
    index: true,
    follow: true
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_ID}');
          `}
        </Script>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#0a0a0a] text-white`}
      >
        <Navigation />
        <main className="min-h-screen">{children}</main>
        <Footer />
        <Analytics />
      </body>
    </html>
  );
}
