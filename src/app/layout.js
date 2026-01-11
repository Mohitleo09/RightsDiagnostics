import { Inter } from "next/font/google";
import "./globals.css";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AIChatbot from './components/AIChatbot';
import { SessionProvider } from 'next-auth/react';
import { auth } from "./auth";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: 'swap',
});

export const metadata = {
  title: "Rights Diagnostics",
  description: "Rights Diagnostics Website",
};

// Move viewport configuration to its proper export
export const viewport = {
  width: "device-width",
  initialScale: 1.0,
};

export default async function RootLayout({ children }) {
  let session = null;
  try {
    session = await auth();
  } catch (error) {
    // Silently handle JWT decryption errors (common when secret changes during development)
    if (error.message?.includes('JWTSessionError') || error.message?.includes('no matching decryption secret')) {
      // Session will remain null, user will need to log in again
      console.log('Session expired or invalid, user needs to re-authenticate');
    } else {
      console.error("Failed to fetch auth session:", error);
    }
    // Continue without session
  }

  return (
    <html lang="en">
      <body
        className={`${inter.variable} antialiased`}
      >
        <SessionProvider session={session}>
          {children}
          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
          />
          <AIChatbot />
        </SessionProvider>
      </body>
    </html>
  );
}