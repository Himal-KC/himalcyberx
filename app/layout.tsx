import type { Metadata } from "next";
import { Geist, Geist_Mono, JetBrains_Mono } from "next/font/google";
import { ConsentRoot } from "@/components/consent/ConsentRoot";
import { buildRootMetadata } from "@/lib/seo/metadata";
import { getGaMeasurementId } from "@/lib/analytics/ga";
import { GOOGLE_CONSENT_DEFAULTS_SCRIPT } from "@/lib/consent/google-consent";
import { getSiteSettings } from "@/lib/settings/site-settings";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return buildRootMetadata(settings);
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  const measurementId = getGaMeasurementId();

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <head>
        {measurementId ? (
          <script
            dangerouslySetInnerHTML={{ __html: GOOGLE_CONSENT_DEFAULTS_SCRIPT }}
          />
        ) : null}
      </head>
      <body className="min-h-full flex flex-col bg-hcx-bg text-hcx-text">
        <ConsentRoot>{children}</ConsentRoot>
      </body>
    </html>
  );
}
