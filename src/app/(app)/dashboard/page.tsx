
'use client';

import React, { Suspense } from 'react';
import { DashboardContent } from '@/components/dashboard/dashboard-content';

// This is the main server component for the dashboard page.
// It wraps the client component in a Suspense boundary for better loading states.
export default function DashboardPage() {
  return (
    // The Suspense boundary can be used to show a fallback UI
    // while the client components and their data are loading.
    <Suspense>
      <DashboardContent />
    </Suspense>
  );
}
