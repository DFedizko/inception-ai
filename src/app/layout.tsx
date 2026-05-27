import type { Metadata } from "next";
import "./globals.css";
import { NotificationViewport } from "@/features/shared/ui";
import { QueryProvider } from "@/features/shared/query/query-provider";

export const metadata: Metadata = {
  title: "Chat",
  description: "Single-user chat with an AI, by text and voice.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <QueryProvider>{children}</QueryProvider>
        <NotificationViewport />
      </body>
    </html>
  );
}
