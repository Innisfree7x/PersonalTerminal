import { Suspense } from 'react';
import { LucianShowcaseClient } from '@/app/showcase/lucian/LucianShowcaseClient';

export default function LucianShowcasePage() {
  return (
    <Suspense fallback={null}>
      <LucianShowcaseClient />
    </Suspense>
  );
}
