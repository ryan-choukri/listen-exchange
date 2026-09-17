import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { CurrentUserProvider } from "@/app/components/CurrentUserProvider";
import { SiteFooter } from "@/app/components/SiteFooter";
import { THEME_STORAGE_KEY } from "@/app/lib/theme";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const themeInitializationScript = `
  (function () {
    try {
      var savedTheme = window.localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});
      document.documentElement.dataset.theme = savedTheme === "light" ? "light" : "dark";
    } catch (error) {
      document.documentElement.dataset.theme = "dark";
    }
  })();
`;

export const metadata: Metadata = {
  title: "ListenExchange - Discover Independent Music & Earn Credits",
  description:
    "Listen to independent music, share genuine feedback, and earn credits for your own tracks.",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='75' font-size='75' fill='%2322c55e'>🎵</text></svg>",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      data-theme="dark"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <Script
          id="listenexchange-theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: themeInitializationScript }}
        />
      </head>
      <body className="flex min-h-full flex-col">
        <CurrentUserProvider>
          {children}
          <SiteFooter />
        </CurrentUserProvider>
      </body>
    </html>
  );
}
