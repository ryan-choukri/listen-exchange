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

const GOOGLE_ANALYTICS_ID = "G-H92QKE68VE";

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
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ANALYTICS_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GOOGLE_ANALYTICS_ID}');
          `}
        </Script>
      </body>
    </html>
  );
}
