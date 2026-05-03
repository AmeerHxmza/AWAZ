import type { Metadata } from 'next';
import { IBM_Plex_Sans, IBM_Plex_Serif } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { Navbar } from '@/components/Navbar';

const sans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
});

const serif = IBM_Plex_Serif({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-serif',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'AWAZ | Civic reporting for Islamabad',
  description: 'AWAZ — report civic issues by text or voice, track status, and map concerns across Islamabad.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable}`}>
      <body
        className={`${sans.className} min-h-screen flex flex-col text-[15px] leading-[1.65] text-stone-900`}
      >
        <AuthProvider>
          <Navbar />
          <main className="flex-grow w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-10 lg:py-14">
            {children}
          </main>
          <footer className="mt-auto border-t border-stone-200/90 bg-white/80 backdrop-blur-[2px]">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-7 text-center text-[13px] text-stone-500 leading-relaxed">
              AWAZ — Islamabad civic reporting. For official correspondence, use routed authority contacts on your
              report.
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
