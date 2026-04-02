'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export interface SpaceTab {
  label: string;
  href: string;
}

interface SpaceTabBarProps {
  tabs: SpaceTab[];
}

export default function SpaceTabBar({ tabs }: SpaceTabBarProps) {
  const pathname = usePathname();

  return (
    <div className="border-b border-border/60 bg-background/80 backdrop-blur-sm">
      <nav className="max-w-[1600px] mx-auto px-6 flex gap-1 overflow-x-auto scrollbar-none">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href || pathname.startsWith(tab.href + '/');
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'relative px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors',
                isActive
                  ? 'text-primary'
                  : 'text-text-secondary hover:text-text-primary'
              )}
            >
              {tab.label}
              {isActive && (
                <span className="absolute inset-x-2 bottom-0 h-[2px] rounded-full bg-primary" />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
