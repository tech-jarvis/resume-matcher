import "./globals.css";

export const metadata = {
  title: "Devsinc Resource Matcher",
  description: "Match client JDs to the best Devsinc engineers",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
