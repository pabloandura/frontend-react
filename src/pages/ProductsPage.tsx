import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ActionIcon,
  Affix,
  Badge,
  Button,
  Card,
  Center,
  Group,
  Image,
  Pagination,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  TextInput,
  Title,
  Tooltip,
} from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { IconPhoto, IconPlus, IconX } from '@tabler/icons-react';
import client from '../api/client';

interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  imageUrl: string | null;
}

interface ProductsResponse {
  data: Product[];
  meta: { total: number; page: number; totalPages: number };
}

const LIMIT = 12;

export default function ProductsPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebouncedValue(search, 300);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    client
      .get<ProductsResponse>('/products', {
        params: { page, limit: LIMIT, ...(debouncedSearch ? { search: debouncedSearch } : {}) },
      })
      .then(({ data }) => {
        setProducts(data.data);
        setTotalPages(data.meta.totalPages);
      })
      .finally(() => setLoading(false));
  }, [page, debouncedSearch]);

  // Reset to page 1 when search changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  return (
    <Stack gap="md">
      <Group justify="space-between" align="center">
        <Title order={2}>Products</Title>
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={() => navigate('/products/new')}
          visibleFrom="sm"
        >
          Add product
        </Button>
      </Group>

      <TextInput
        placeholder="Search products…"
        value={search}
        onChange={(e) => setSearch(e.currentTarget.value)}
        rightSection={
          search ? (
            <ActionIcon variant="transparent" onClick={() => setSearch('')}>
              <IconX size={16} />
            </ActionIcon>
          ) : null
        }
      />

      {loading ? (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
          {Array.from({ length: LIMIT }).map((_, i) => (
            <Card key={i} withBorder radius="md" padding="sm">
              <Skeleton height={180} mb="sm" radius="md" />
              <Skeleton height={16} mb={6} />
              <Skeleton height={12} width="60%" />
            </Card>
          ))}
        </SimpleGrid>
      ) : products.length === 0 ? (
        <Center py="xl">
          <Stack align="center" gap="xs">
            <Text c="dimmed">No products found.</Text>
            {search && (
              <Button variant="subtle" size="xs" onClick={() => setSearch('')}>
                Clear search
              </Button>
            )}
          </Stack>
        </Center>
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
          {products.map((p) => (
            <Card
              key={p.id}
              withBorder
              radius="md"
              padding="sm"
              style={{ cursor: 'pointer' }}
              onClick={() => navigate(`/products/${p.id}`)}
            >
              <Card.Section>
                {p.imageUrl ? (
                  <Image src={p.imageUrl} height={180} fit="cover" alt={p.name} />
                ) : (
                  <Center h={180} bg="gray.1">
                    <IconPhoto size={48} color="gray" />
                  </Center>
                )}
              </Card.Section>

              <Stack gap={4} mt="sm">
                <Text fw={600} lineClamp={1}>
                  {p.name}
                </Text>
                <Group justify="space-between">
                  <Badge variant="outline" size="sm">
                    {p.sku}
                  </Badge>
                  <Text fw={700} c="violet">
                    ${p.price.toFixed(2)}
                  </Text>
                </Group>
              </Stack>
            </Card>
          ))}
        </SimpleGrid>
      )}

      {totalPages > 1 && (
        <Group justify="center" mt="sm">
          <Pagination value={page} onChange={setPage} total={totalPages} />
        </Group>
      )}

      {/* FAB — visible on mobile only */}
      <Affix position={{ bottom: 24, right: 24 }} hiddenFrom="sm">
        <Tooltip label="Add product">
          <ActionIcon
            size={56}
            radius="xl"
            onClick={() => navigate('/products/new')}
          >
            <IconPlus size={24} />
          </ActionIcon>
        </Tooltip>
      </Affix>
    </Stack>
  );
}
