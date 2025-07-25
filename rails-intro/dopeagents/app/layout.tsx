import type { Metadata } from "next";
import "./index.css";


export const metadata: Metadata = {
  title: "Dope LLM Agents",
  description: "Dope LLM Agents",
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
