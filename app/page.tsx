"use client";

import { AppProvider } from '@/context/app-context';
import { NajvaApp } from '@/components/najva-app';

export default function Home() {
  console.log('[v0] Najva App initialized');
  
  return (
    <AppProvider>
      <NajvaApp />
    </AppProvider>
  );
}
