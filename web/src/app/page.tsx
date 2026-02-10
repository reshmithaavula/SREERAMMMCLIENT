import Dashboard from '@/components/Dashboard';

export default function Home() {
  // Return Dashboard immediately. Data will be fetched on client side.
  return (
    <Dashboard
      initialGainers={[]}
      initialLosers={[]}
      initialWatchlist={[]}
      initialPortfolio={[]}
      initialQuotes={{}}
    />
  );
}
