import { useEffect, useState } from 'react';
import client from '../api/client';

interface TotalLastMonth { period: string; total: number; }
interface HighestOrder { id: string; clientName: string; total: number; }

export default function ReportsPage() {
  const [lastMonth, setLastMonth] = useState<TotalLastMonth | null>(null);
  const [highest, setHighest] = useState<HighestOrder | null>(null);

  useEffect(() => {
    client.get<{ data: TotalLastMonth }>('/orders/reports/total-last-month')
      .then(({ data }) => setLastMonth(data.data));
    client.get<{ data: HighestOrder }>('/orders/reports/highest')
      .then(({ data }) => setHighest(data.data));
  }, []);

  return (
    <main>
      <h1>Reports</h1>
      <section>
        <h2>Total sold last month</h2>
        {lastMonth ? (
          <p>{lastMonth.period}: <strong>${lastMonth.total.toFixed(2)}</strong></p>
        ) : <p>Loading…</p>}
      </section>
      <section>
        <h2>Highest order</h2>
        {highest ? (
          <p>{highest.clientName} — <strong>${highest.total.toFixed(2)}</strong></p>
        ) : <p>Loading…</p>}
      </section>
    </main>
  );
}
