import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Affix,
  ActionIcon,
  Button,
  CopyButton,
  Divider,
  Group,
  NumberInput,
  Paper,
  Select,
  Stack,
  Text,
  TextInput,
  Title,
  Tooltip,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconCopy, IconCheck, IconTrash, IconPlus } from '@tabler/icons-react';
import client from '../api/client';

interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
}

interface OrderItem {
  productId: string;
  quantity: number;
}

export default function CreateOrderPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [confirmedOrderId, setConfirmedOrderId] = useState('');

  useEffect(() => {
    client
      .get<{ data: Product[] }>('/products', { params: { limit: 100 } })
      .then(({ data }) => setProducts(data.data));
  }, []);

  const form = useForm<{ clientName: string; items: OrderItem[] }>({
    initialValues: {
      clientName: '',
      items: [{ productId: '', quantity: 1 }],
    },
    validate: {
      clientName: (v) => (v.trim().length > 0 ? null : 'Client name is required'),
      items: {
        productId: (v) => (v ? null : 'Select a product'),
        quantity: (v) => (v >= 1 ? null : 'Quantity must be at least 1'),
      },
    },
  });

  const productOptions = products.map((p) => ({
    value: p.id,
    label: `${p.name} — $${p.price.toFixed(2)}`,
  }));

  function runningTotal(): number {
    return form.values.items.reduce((sum, item) => {
      const product = products.find((p) => p.id === item.productId);
      if (!product || item.quantity < 1) return sum;
      return Math.round((sum + product.price * item.quantity) * 100) / 100;
    }, 0);
  }

  async function handleSubmit(values: typeof form.values) {
    const validItems = values.items.filter((i) => i.productId && i.quantity > 0);
    if (!validItems.length) {
      notifications.show({ color: 'red', message: 'Add at least one product.' });
      return;
    }

    setSubmitting(true);
    try {
      const { data } = await client.post<{ data: { id: string } }>('/orders', {
        clientName: values.clientName,
        items: validItems.map((i) => ({ productId: i.productId, quantity: Number(i.quantity) })),
      });
      setConfirmedOrderId(data.data.id);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
          ?.message ?? 'Failed to create order.';
      notifications.show({ color: 'red', title: 'Error', message: msg });
    } finally {
      setSubmitting(false);
    }
  }

  if (confirmedOrderId) {
    return (
      <Stack gap="md" maw={480} mx="auto">
        <Title order={2}>Order confirmed!</Title>
        <Paper p="lg" withBorder radius="md">
          <Stack gap="md">
            <Text>Your order has been placed successfully.</Text>
            <Group>
              <Text size="sm" c="dimmed">
                Order ID:
              </Text>
              <Text ff="monospace" size="sm" style={{ wordBreak: 'break-all' }}>
                {confirmedOrderId}
              </Text>
              <CopyButton value={confirmedOrderId}>
                {({ copied, copy }) => (
                  <Tooltip label={copied ? 'Copied!' : 'Copy ID'}>
                    <ActionIcon variant="subtle" onClick={copy} color={copied ? 'teal' : 'gray'}>
                      {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                    </ActionIcon>
                  </Tooltip>
                )}
              </CopyButton>
            </Group>
            <Group mt="xs">
              <Button
                variant="outline"
                onClick={() => {
                  setConfirmedOrderId('');
                  form.reset();
                }}
              >
                New order
              </Button>
              <Button onClick={() => navigate('/products')}>Go to products</Button>
            </Group>
          </Stack>
        </Paper>
      </Stack>
    );
  }

  return (
    <Stack gap="md" maw={560} mx="auto" pb={80}>
      <Title order={2}>Create Order</Title>

      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <TextInput
            label="Client name"
            placeholder="e.g. Acme Corp"
            data-autofocus
            {...form.getInputProps('clientName')}
          />

          <Divider label="Products" labelPosition="left" />

          <Stack gap="sm">
            {form.values.items.map((_, index) => (
              <Paper key={index} p="sm" withBorder radius="md">
                <Stack gap="xs">
                  <Select
                    label="Product"
                    placeholder="Select a product"
                    data={productOptions}
                    searchable
                    {...form.getInputProps(`items.${index}.productId`)}
                  />
                  <Group align="flex-end">
                    <NumberInput
                      label="Quantity"
                      min={1}
                      style={{ flex: 1 }}
                      {...form.getInputProps(`items.${index}.quantity`)}
                    />
                    {form.values.items.length > 1 && (
                      <ActionIcon
                        color="red"
                        variant="subtle"
                        size="lg"
                        mb={1}
                        onClick={() => form.removeListItem('items', index)}
                      >
                        <IconTrash size={18} />
                      </ActionIcon>
                    )}
                  </Group>
                </Stack>
              </Paper>
            ))}
          </Stack>

          <Button
            variant="subtle"
            leftSection={<IconPlus size={16} />}
            onClick={() => form.insertListItem('items', { productId: '', quantity: 1 })}
          >
            Add product
          </Button>

          <Button type="submit" loading={submitting}>
            Place order
          </Button>
        </Stack>
      </form>

      {/* Sticky running total — stays visible while scrolling on mobile */}
      <Affix position={{ bottom: 0, left: 0, right: 0 }} hiddenFrom="sm">
        <Paper p="md" shadow="md" radius={0}>
          <Group justify="space-between">
            <Text size="sm" c="dimmed">
              Running total
            </Text>
            <Text fw={700} size="lg">
              ${runningTotal().toFixed(2)}
            </Text>
          </Group>
        </Paper>
      </Affix>

      {/* Desktop running total — inline */}
      <Paper p="md" withBorder radius="md" visibleFrom="sm">
        <Group justify="space-between">
          <Text fw={500}>Running total</Text>
          <Text fw={700} size="xl" c="violet">
            ${runningTotal().toFixed(2)}
          </Text>
        </Group>
      </Paper>
    </Stack>
  );
}
