'use client';

import { NotificationListener } from '@/components/misc/NotificationListener';
import { setupEchoReverb } from '@/lib/echo';
import { type ReactNode } from 'react';

setupEchoReverb();

interface Props {
  children: ReactNode;
}

export function EchoProvider({ children }: Props) {
  return (
    <>
      <NotificationListener />
      {children}
    </>
  );
}
