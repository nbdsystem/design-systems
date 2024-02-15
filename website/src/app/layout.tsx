import './globals.css';

export const metadata = {
  title: 'Design Systems',
  description: 'A list of design systems across the web',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
