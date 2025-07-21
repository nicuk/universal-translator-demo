import './globals.css'

export const metadata = {
  title: 'Universal Translator - Real-time Translation',
  description: 'Real-time audio translation for global communication',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="font-sans">{children}</body>
    </html>
  )
} 