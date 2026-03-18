import { useCallback, useEffect, useState } from 'react';
import { Button, Group, Paper, SimpleGrid, Skeleton, Stack, Text, Title } from '@mantine/core';
import { IconRefresh } from '@tabler/icons-react';
import client from '../api/client';

interface TotalLastMonth {
  period: string;
  total: number;
}
interface HighestOrder {
  id: string;
  clientName: string;
  total: number;
}

type AsyncState<T> = { data: T | null; loading: boolean; error: boolean };

function formatPeriod(raw: string): string {
  // Backend returns "YYYY-MM" — format as "March 2026"
  const [year, month] = raw.split('-');
  if (!year || !month) return raw;
  const date = new Date(Number(year), Number(month) - 1);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function StatCard({
  label,
  loading,
  error,
  onRetry,
  children,
}: {
  label: string;
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  children: React.ReactNode;
}) {
  return (
    <Paper p="lg" withBorder radius="md">
      <Stack gap="xs">
        <Text size="sm" c="dimmed" tt="uppercase" fw={600} ls={0.5}>
          {label}
        </Text>
        {loading && (
          <>
            <Skeleton height={36} width="70%" />
            <Skeleton height={16} width="40%" />
          </>
        )}
        {error && (
          <Stack gap={4}>
            <Text c="red" size="sm">
              Failed to load.
            </Text>
            <Button
              variant="subtle"
              size="xs"
              leftSection={<IconRefresh size={14} />}
              onClick={onRetry}
            >
              Retry
            </Button>
          </Stack>
        )}
        {!loading && !error && children}
      </Stack>
    </Paper>
  );
}

export default function ReportsPage() {
  const [lastMonth, setLastMonth] = useState<AsyncState<TotalLastMonth>>({
    data: null,
    loading: true,
    error: false,
  });
  const [highest, setHighest] = useState<AsyncState<HighestOrder>>({
    data: null,
    loading: true,
    error: false,
  });

  const fetchLastMonth = useCallback(() => {
    setLastMonth({ data: null, loading: true, error: false });
    client
      .get<{ data: TotalLastMonth }>('/orders/reports/total-last-month')
      .then(({ data }) => setLastMonth({ data: data.data, loading: false, error: false }))
      .catch(() => setLastMonth({ data: null, loading: false, error: true }));
  }, []);

  const fetchHighest = useCallback(() => {
    setHighest({ data: null, loading: true, error: false });
    client
      .get<{ data: HighestOrder }>('/orders/reports/highest')
      .then(({ data }) => setHighest({ data: data.data, loading: false, error: false }))
      .catch(() => setHighest({ data: null, loading: false, error: true }));
  }, []);

  useEffect(() => {
    fetchLastMonth();
    fetchHighest();
  }, [fetchLastMonth, fetchHighest]);

  return (
    <Stack gap="md">
      <Title order={2}>Reports</Title>

      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
        <StatCard
          label="Total sold last month"
          loading={lastMonth.loading}
          error={lastMonth.error}
          onRetry={fetchLastMonth}
        >
          {lastMonth.data && (
            <>
              <Title order={1} c="violet">
                ${lastMonth.data.total.toFixed(2)}
              </Title>
              <Text size="sm" c="dimmed">
                {formatPeriod(lastMonth.data.period)}
              </Text>
            </>
          )}
        </StatCard>

        <StatCard
          label="Highest order"
          loading={highest.loading}
          error={highest.error}
          onRetry={fetchHighest}
        >
          {highest.data && (
            <>
              <Title order={1} c="violet">
                ${highest.data.total.toFixed(2)}
              </Title>
              <Group gap={4}>
                <Text size="sm" c="dimmed">
                  by
                </Text>
                <Text size="sm" fw={500}>
                  {highest.data.clientName}
                </Text>
              </Group>
            </>
          )}
        </StatCard>
      </SimpleGrid>
    </Stack>
  );
}
