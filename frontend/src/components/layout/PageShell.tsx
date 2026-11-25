import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Navbar } from './Navbar';
import { MobileNav } from './MobileNav';
import { CinematicBackdrop } from './CinematicBackdrop';
import { motion } from 'motion/react';

interface PageShellProps {
  children: React.ReactNode;
}

export const PageShell: React.FC<PageShellProps> = ({ children }) => {
  const { pathname } = useLocation();

  // Always start each route strictly at top=0 so headings and HUD elements are never scrolled under the fixed navbar
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);

  return (
    <div className="min-h-screen text-[#FFFDF7] flex flex-col relative selection:bg-[#E8C97A]/30 selection:text-[#FFFDF7]">
      {/* Per-Route Enchanted Emerald Conservatory / Valley WebP Backdrop */}
      <CinematicBackdrop />

      {/* Floating Transparent Emerald Navbar */}
      <Navbar />

      {/* Main Content Area — reliable top clearance eliminating navbar overlap */}
      <main className="flex-1 w-full pt-28 sm:pt-32 lg:pt-36 pb-28 lg:pb-16 flex flex-col relative z-10">
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
          className="flex-1 flex flex-col"
        >
          {children}
        </motion.div>
      </main>

      {/* Mobile Bottom Dock */}
      <MobileNav />
    </div>
  );
};
