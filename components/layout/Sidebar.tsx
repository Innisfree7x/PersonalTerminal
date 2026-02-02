'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Calendar, 
  Target, 
  GraduationCap, 
  Briefcase,
  ChevronLeft,
  User,
  Settings,
  LogOut
} from 'lucide-react';
import { useSidebar } from './SidebarProvider';

const navigation = [
  { name: 'Today', href: '/today', icon: LayoutDashboard },
  { name: 'Calendar', href: '/calendar', icon: Calendar },
  { name: 'Goals', href: '/goals', icon: Target },
  { name: 'University', href: '/university', icon: GraduationCap },
  { name: 'Career', href: '/career', icon: Briefcase },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const { isCollapsed, setIsCollapsed } = useSidebar();

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2.5 rounded-lg bg-surface border border-border text-text-primary hover:bg-surface-hover hover:border-primary transition-colors"
          aria-label="Toggle menu"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <svg
            className="w-5 h-5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            {isOpen ? (
              <path d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </motion.button>
      </div>

      {/* Overlay for mobile */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-30"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          width: isCollapsed ? '80px' : '240px',
        }}
        className={`fixed top-0 left-0 z-40 h-screen transition-all ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 bg-surface/80 backdrop-blur-xl border-r border-border`}
      >
        <div className="h-full flex flex-col">
          {/* Logo / Brand */}
          <div className="h-16 flex items-center justify-between px-6 border-b border-border">
            {!isCollapsed ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center">
                  <span className="text-white font-bold text-base">P</span>
                </div>
                <span className="font-semibold text-text-primary">Prism</span>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-center w-full"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center">
                  <span className="text-white font-bold text-base">P</span>
                </div>
              </motion.div>
            )}
            
            {/* Collapse button (desktop only) - Always visible */}
            {!isCollapsed && (
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="hidden lg:flex p-1.5 rounded-md hover:bg-surface-hover text-text-secondary hover:text-text-primary transition-colors"
                aria-label="Collapse sidebar"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Expand button when collapsed */}
          {isCollapsed && (
            <div className="hidden lg:flex justify-center py-2 border-b border-border">
              <button
                onClick={() => setIsCollapsed(false)}
                className="p-1.5 rounded-md hover:bg-surface-hover text-text-secondary hover:text-text-primary transition-colors"
                aria-label="Expand sidebar"
              >
                <ChevronLeft className="w-4 h-4 rotate-180" />
              </button>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className="relative block group"
                >
                  {/* Active indicator */}
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active"
                      className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary rounded-r-full"
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                  
                  <div
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
                    } ${isCollapsed ? 'justify-center' : ''}`}
                  >
                    <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-primary' : ''}`} />
                    {!isCollapsed && (
                      <span className="truncate">{item.name}</span>
                    )}
                  </div>
                  
                  {/* Tooltip for collapsed state */}
                  {isCollapsed && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-surface border border-border rounded-md text-xs text-text-primary whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                      {item.name}
                    </div>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User Profile Card */}
          <div className="p-3 border-t border-border">
            <motion.div
              className={`flex items-center gap-3 p-2.5 rounded-lg hover:bg-surface-hover cursor-pointer transition-colors ${
                isCollapsed ? 'justify-center' : ''
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-light to-primary flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-white" />
              </div>
              
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">
                    User
                  </p>
                  <p className="text-xs text-text-tertiary truncate">
                    user@example.com
                  </p>
                </div>
              )}
              
              {!isCollapsed && (
                <Settings className="w-4 h-4 text-text-tertiary hover:text-text-primary transition-colors" />
              )}
            </motion.div>
          </div>
        </div>
      </motion.aside>
    </>
  );
}
