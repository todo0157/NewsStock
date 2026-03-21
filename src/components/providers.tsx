'use client';

import { useState } from 'react';

// TODO: 아래 패키지들 설치 후 복원
// import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// import { SessionProvider } from 'next-auth/react';
// import { TooltipProvider } from '@/components/ui/tooltip';

export function Providers({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
