import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Home,
  BrainCircuit,
  PenTool,
  Route as RouteIcon,
  BookOpen,
} from 'lucide-react';

const NAV_ITEMS = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/tutor', label: 'Studio', icon: BrainCircuit },
  { path: '/practice', label: 'Practice', icon: PenTool },
  { path: '/progress', label: 'Journey', icon: RouteIcon },
  { path: '/library', label: 'Library', icon: BookOpen },
];

export const MobileNav: React.FC = () => {
  const location = useLocation();

  return (
    <nav
      aria-label="Mobile Navigation"
      className="lg:hidden fixed bottom-3.5 left-4 right-4 max-w-md mx-auto z-50"
    >
      <div className="relative rounded-full bg-gradient-to-b from-[#0B2318]/92 via-[#071A11]/95 to-[#040E09]/98 backdrop-blur-2xl border border-[#E8C97A]/24 shadow-[0_18px_45px_-8px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,248,224,0.16)] p-1.5 flex items-center justify-around">
        {/* Top rim specular gold glint */}
        <span className="pointer-events-none absolute top-0 left-8 right-8 h-[1px] bg-gradient-to-r from-transparent via-[#F8EAC4]/40 to-transparent" />

        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.path);

          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className="relative flex flex-col items-center justify-center gap-0.5 flex-1 py-1.5 rounded-full transition-colors duration-200 select-none"
            >
              {isActive && (
                <motion.span
                  layoutId="mobile-nav-gem"
                  transition={{
                    type: 'spring',
                    stiffness: 400,
                    damping: 32,
                    mass: 0.85,
                  }}
                  className="absolute inset-0 rounded-full bg-gradient-to-b from-[#236345]/95 via-[#15422D]/95 to-[#0C291C]/98 border border-[#8CDAB2]/45 shadow-[0_4px_18px_-2px_rgba(82,183,136,0.34),inset_0_1px_1px_rgba(255,253,247,0.18)]"
                >
                  <span className="absolute -bottom-[1px] left-1/2 -translate-x-1/2 w-6 h-[2px] rounded-full bg-gradient-to-r from-transparent via-[#F8EAC4] to-transparent shadow-[0_0_8px_#E8C97A]" />
                </motion.span>
              )}

              <Icon
                className={`relative z-10 w-4 h-4 transition-colors duration-200 ${isActive ? 'text-[#F5E3B3]' : 'text-[#74A48A]'
                  }`}
              />
              <span
                className={`relative z-10 text-[10px] tracking-tight transition-colors duration-200 ${isActive ? 'text-[#FFFDF7] font-semibold' : 'text-[#A8A69B] font-medium'
                  }`}
              >
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
