'use client';

import { motion } from 'framer-motion';
import { GraduationCap } from 'lucide-react';
import KitSyncPanel from '@/components/features/university/KitSyncPanel';

export default function SyncPage() {
  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03]">
          <GraduationCap className="h-5 w-5 text-university-accent" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-text-primary">KIT Sync</h1>
          <p className="text-sm text-text-secondary">
            CAMPUS und ILIAS in einem eigenen Bereich, getrennt von deinen Kurskarten.
          </p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.12 }}
      >
        <KitSyncPanel />
      </motion.div>
    </div>
  );
}
