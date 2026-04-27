import nextDynamic from 'next/dynamic';

import LoadingPage from '@/components/misc/LoadingPage';

const HardTimeTraceabilityClient = nextDynamic(
  () => import('./_components/hard-time-traceability-client').then((module) => module.HardTimeTraceabilityClient),
  {
    ssr: false,
    loading: () => <LoadingPage />,
  },
);

export const dynamic = 'force-dynamic';

export default function HardTimeTraceabilityPage() {
  return <HardTimeTraceabilityClient />;
}
