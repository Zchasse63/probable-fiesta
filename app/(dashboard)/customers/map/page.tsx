import { Suspense } from 'react';
import CustomersMapContent from './map-content';

export const dynamic = 'force-dynamic';

export default function CustomersMapPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen"><div className="text-muted-foreground">Loading map...</div></div>}>
      <CustomersMapContent />
    </Suspense>
  );
}
