import { Space_Grotesk } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={spaceGrotesk.className}
        style={{ margin: 0, backgroundColor: "#ffffff", color: "#0c0f0a" }}
      >
        {children}
      </body>
    </html>
  );
}
