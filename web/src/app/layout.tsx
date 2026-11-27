import type { Metadata } from "next";
import { Anonymous_Pro, Archivo_Black, Fira_Sans } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const archivoBlack = Archivo_Black({
  variable: "--font-archivo-black",
  weight: "400",
  subsets: ["latin"],
});

const firaSans = Fira_Sans({
  variable: "--font-fira-sans",
  weight: ["400", "600"],
  subsets: ["latin"],
});

const anonymousPro = Anonymous_Pro({
  variable: "--font-anonymous-pro",
  weight: ["400", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Botohan",
  description: "On-chain polls on Ethereum Sepolia. Every vote is a transaction.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${archivoBlack.variable} ${firaSans.variable} ${anonymousPro.variable} antialiased`}
    >
      <body className="font-sans text-base">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
