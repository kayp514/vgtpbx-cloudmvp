import type { Metadata } from 'next'
import localFont from "next/font/local";
import './globals.css'
import { TernSecureProvider } from "@tern-secure/nextjs"
import { ThemeProvider } from '@/components/theme-provider'

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: 'Cloud UCaaS PBX',
  description: 'Modern Unified Communications as a Service Platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <TernSecureProvider requiresVerification={false} >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
        </TernSecureProvider>
      </body>
    </html>
  )
}
