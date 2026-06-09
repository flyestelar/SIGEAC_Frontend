'use client';

import { useLinkStatus } from 'next/link';
import { motion } from 'motion/react';

/**
 * Loading indicator for sidebar navigation links.
 * Uses `useLinkStatus` from Next.js to detect pending navigations.
 * Always rendered (avoids layout shift) — only toggles visibility/opacity.
 */
export function LinkStatusIndicator() {
  const { pending } = useLinkStatus();

  return (
    <span aria-hidden className="inline-block w-2 h-2 ml-1.5">
      <motion.span
        className="block w-full h-full rounded-full bg-sky-500/50"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={
          pending
            ? {
                opacity: [0.3, 0.9, 0.9, 0.3, 0.3, 0.9],
                scale: [0.5, 1, 1, 0.5, 0.5, 1],
              }
            : { opacity: 0, scale: 0.5 }
        }
        transition={
          pending
            ? {
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut',
                times: [0, 0.1, 0.5, 0.6, 0.9, 1],
              }
            : { duration: 0.3 }
        }
      />
    </span>
  );
}
