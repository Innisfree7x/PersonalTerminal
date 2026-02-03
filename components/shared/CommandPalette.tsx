'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Command } from 'cmdk';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Home,
  Target,
  Briefcase,
  GraduationCap,
  Calendar,
  Plus,
  Zap,
} from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const [search, setSearch] = useState('');

  // Navigation commands
  const navigationCommands = [
    {
      id: 'nav-today',
      label: 'Dashboard',
      icon: Home,
      action: () => router.push('/today'),
      keywords: ['dashboard', 'today', 'home', 'overview'],
    },
    {
      id: 'nav-goals',
      label: 'Goals',
      icon: Target,
      action: () => router.push('/goals'),
      keywords: ['goals', 'objectives', 'targets'],
    },
    {
      id: 'nav-career',
      label: 'Career',
      icon: Briefcase,
      action: () => router.push('/career'),
      keywords: ['career', 'jobs', 'applications', 'interviews'],
    },
    {
      id: 'nav-university',
      label: 'University',
      icon: GraduationCap,
      action: () => router.push('/university'),
      keywords: ['university', 'courses', 'studies', 'exercises'],
    },
    {
      id: 'nav-calendar',
      label: 'Calendar',
      icon: Calendar,
      action: () => router.push('/calendar'),
      keywords: ['calendar', 'schedule', 'events'],
    },
  ];

  // Quick action commands
  const quickActions = [
    {
      id: 'action-add-goal',
      label: 'Add New Goal',
      icon: Plus,
      action: () => {
        router.push('/goals');
        // TODO: Trigger goal modal
      },
      keywords: ['add', 'new', 'create', 'goal'],
      shortcut: 'G',
    },
    {
      id: 'action-add-application',
      label: 'Add Job Application',
      icon: Plus,
      action: () => {
        router.push('/career');
        // TODO: Trigger application modal
      },
      keywords: ['add', 'new', 'create', 'job', 'application'],
      shortcut: 'A',
    },
    {
      id: 'action-add-course',
      label: 'Add Course',
      icon: Plus,
      action: () => {
        router.push('/university');
        // TODO: Trigger course modal
      },
      keywords: ['add', 'new', 'create', 'course'],
      shortcut: 'C',
    },
    {
      id: 'action-add-task',
      label: 'Add Quick Task',
      icon: Plus,
      action: () => {
        router.push('/today');
        // TODO: Trigger task input
      },
      keywords: ['add', 'new', 'create', 'task', 'todo'],
      shortcut: 'T',
    },
  ];

  const allCommands = [...navigationCommands, ...quickActions];

  const handleSelect = useCallback(
    (command: typeof allCommands[0]) => {
      command.action();
      onClose();
      setSearch('');
    },
    [onClose]
  );

  // Close on escape
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        setSearch('');
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Command Palette */}
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="w-full max-w-2xl pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <Command
                className="bg-surface/95 backdrop-blur-xl border-2 border-primary/30 rounded-2xl shadow-2xl overflow-hidden"
                value={search}
                onValueChange={setSearch}
              >
                {/* Search Input */}
                <div className="flex items-center gap-3 px-4 py-4 border-b border-border">
                  <Search className="w-5 h-5 text-text-tertiary" />
                  <Command.Input
                    placeholder="Type a command or search..."
                    className="flex-1 bg-transparent text-text-primary placeholder:text-text-tertiary outline-none text-base"
                    autoFocus
                  />
                  <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 bg-surface-hover border border-border rounded text-xs text-text-tertiary">
                    ESC
                  </kbd>
                </div>

                {/* Results */}
                <Command.List className="max-h-[400px] overflow-y-auto p-2">
                  <Command.Empty className="py-12 text-center text-text-tertiary text-sm">
                    No results found.
                  </Command.Empty>

                  {/* Navigation Section */}
                  <Command.Group
                    heading="Navigation"
                    className="px-2 py-2 text-xs font-semibold text-text-tertiary uppercase tracking-wider"
                  >
                    {navigationCommands.map((command) => {
                      const Icon = command.icon;
                      return (
                        <Command.Item
                          key={command.id}
                          value={`${command.label} ${command.keywords.join(' ')}`}
                          onSelect={() => handleSelect(command)}
                          className="flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer data-[selected=true]:bg-primary/10 data-[selected=true]:text-primary transition-colors mb-1"
                        >
                          <Icon className="w-4 h-4 flex-shrink-0" />
                          <span className="flex-1 text-sm font-medium">{command.label}</span>
                        </Command.Item>
                      );
                    })}
                  </Command.Group>

                  {/* Quick Actions Section */}
                  <Command.Group
                    heading="Quick Actions"
                    className="px-2 py-2 text-xs font-semibold text-text-tertiary uppercase tracking-wider mt-2"
                  >
                    {quickActions.map((command) => {
                      const Icon = command.icon;
                      return (
                        <Command.Item
                          key={command.id}
                          value={`${command.label} ${command.keywords.join(' ')}`}
                          onSelect={() => handleSelect(command)}
                          className="flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer data-[selected=true]:bg-success/10 data-[selected=true]:text-success transition-colors mb-1"
                        >
                          <Icon className="w-4 h-4 flex-shrink-0" />
                          <span className="flex-1 text-sm font-medium">{command.label}</span>
                          {command.shortcut && (
                            <kbd className="px-2 py-0.5 bg-surface-hover border border-border rounded text-xs text-text-tertiary">
                              ⌘{command.shortcut}
                            </kbd>
                          )}
                        </Command.Item>
                      );
                    })}
                  </Command.Group>
                </Command.List>

                {/* Footer */}
                <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-surface/50">
                  <div className="flex items-center gap-4 text-xs text-text-tertiary">
                    <div className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 bg-surface-hover border border-border rounded text-[10px]">
                        ↑↓
                      </kbd>
                      <span>Navigate</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 bg-surface-hover border border-border rounded text-[10px]">
                        ↵
                      </kbd>
                      <span>Select</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 bg-surface-hover border border-border rounded text-[10px]">
                        ESC
                      </kbd>
                      <span>Close</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-text-tertiary">
                    <Zap className="w-3 h-3" />
                    <span>Prism Command</span>
                  </div>
                </div>
              </Command>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
