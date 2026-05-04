import nextDynamic from 'next/dynamic';

import LoadingPage from '@/components/misc/LoadingPage';

const HardTimeDashboard = nextDynamic(
  () => import('./_components/hard-time-dashboard').then((module) => module.HardTimeDashboard),
  {
    ssr: false,
    loading: () => <LoadingPage />,
  },
);

export const dynamic = 'force-dynamic';

export default function HardTimePage() {
  return <HardTimeDashboard />;
}
