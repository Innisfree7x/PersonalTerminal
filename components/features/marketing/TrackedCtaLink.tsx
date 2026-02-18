'use client';

import Link, { type LinkProps } from 'next/link';
import type { ReactNode } from 'react';
import { trackMarketingEvent, type MarketingEventName, type MarketingEventPayload } from '@/lib/analytics/marketing';

type TrackedCtaLinkProps = LinkProps & {
  children: ReactNode;
  className?: string;
  eventName: MarketingEventName;
  eventPayload?: MarketingEventPayload;
};

export function TrackedCtaLink({
  children,
  className,
  eventName,
  eventPayload,
  ...linkProps
}: TrackedCtaLinkProps) {
  return (
    <Link
      {...linkProps}
      className={className}
      onClick={() => {
        void trackMarketingEvent(eventName, eventPayload);
      }}
    >
      {children}
    </Link>
  );
}
