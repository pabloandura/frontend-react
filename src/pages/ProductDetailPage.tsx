import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ActionIcon,
  Badge,
  Center,
  Group,
  Image,
  Skeleton,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { IconArrowLeft, IconPhoto } from '@tabler/icons-react';
import client from '../api/client';

interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  imageUrl: string | null;
}

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    client
      .get<{ data: Product }>(`/products/${id}`)
      .then(({ data }) => setProduct(data.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <Stack gap="md" maw={600} mx="auto">
      <Group>
        <ActionIcon variant="subtle" size="lg" onClick={() => navigate(-1)}>
          <IconArrowLeft />
        </ActionIcon>
        <Title order={3}>Product detail</Title>
      </Group>

      {loading && (
        <>
          <Skeleton height={320} radius="md" />
          <Skeleton height={24} width="60%" />
          <Skeleton height={16} width="30%" />
        </>
      )}

      {error && (
        <Center py="xl">
          <Text c="red">Product not found.</Text>
        </Center>
      )}

      {product && (
        <Stack gap="md">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              height={320}
              fit="cover"
              radius="md"
              alt={product.name}
            />
          ) : (
            <Center h={320} bg="gray.1" style={{ borderRadius: 8 }}>
              <IconPhoto size={64} color="gray" />
            </Center>
          )}

          <Stack gap={6}>
            <Title order={2}>{product.name}</Title>
            <Group>
              <Badge variant="outline">{product.sku}</Badge>
              <Text fw={700} size="xl" c="violet">
                ${product.price.toFixed(2)}
              </Text>
            </Group>
          </Stack>
        </Stack>
      )}
    </Stack>
  );
}
