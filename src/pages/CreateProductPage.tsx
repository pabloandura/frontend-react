import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ActionIcon,
  Button,
  Center,
  Group,
  Image,
  NumberInput,
  Paper,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { Dropzone, IMAGE_MIME_TYPE } from '@mantine/dropzone';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconArrowLeft, IconPhoto, IconUpload, IconX } from '@tabler/icons-react';
import client from '../api/client';

export default function CreateProductPage() {
  const navigate = useNavigate();
  const [preview, setPreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const form = useForm({
    initialValues: { name: '', sku: '', price: 0 },
    validate: {
      name: (v) => (v.trim().length > 0 ? null : 'Name is required'),
      sku: (v) => (v.trim().length > 0 ? null : 'SKU is required'),
      price: (v) => (v > 0 ? null : 'Price must be greater than 0'),
    },
  });

  function handleDrop(files: File[]) {
    const file = files[0];
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(values: typeof form.values) {
    setLoading(true);
    try {
      const body = new FormData();
      body.append('name', values.name);
      body.append('sku', values.sku);
      body.append('price', String(values.price));
      if (imageFile) body.append('image', imageFile);

      await client.post('/products', body, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      notifications.show({ color: 'green', title: 'Product created', message: values.name });
      navigate('/products');
    } catch {
      notifications.show({
        color: 'red',
        title: 'Failed to create product',
        message: 'Check the form and try again.',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Stack gap="md" maw={560} mx="auto">
      <Group>
        <ActionIcon variant="subtle" size="lg" onClick={() => navigate('/products')}>
          <IconArrowLeft />
        </ActionIcon>
        <Title order={2}>Add product</Title>
      </Group>

      <Paper p="lg" withBorder radius="md">
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="md">
            <TextInput
              label="Name"
              placeholder="e.g. Wireless Headphones"
              {...form.getInputProps('name')}
            />
            <TextInput
              label="SKU"
              placeholder="e.g. WH-1000"
              {...form.getInputProps('sku')}
            />
            <NumberInput
              label="Price"
              placeholder="0.00"
              min={0.01}
              decimalScale={2}
              fixedDecimalScale
              prefix="$"
              {...form.getInputProps('price')}
            />

            <div>
              <Text size="sm" fw={500} mb={4}>
                Image (optional)
              </Text>
              {preview ? (
                <Stack gap="xs">
                  <Image src={preview} height={200} fit="cover" radius="md" alt="Preview" />
                  <Button
                    variant="subtle"
                    color="red"
                    size="xs"
                    leftSection={<IconX size={14} />}
                    onClick={() => { setPreview(null); setImageFile(null); }}
                  >
                    Remove image
                  </Button>
                </Stack>
              ) : (
                <Dropzone
                  onDrop={handleDrop}
                  accept={IMAGE_MIME_TYPE}
                  maxSize={5 * 1024 ** 2}
                  maxFiles={1}
                >
                  <Center h={120}>
                    <Stack align="center" gap={4}>
                      <Dropzone.Accept>
                        <IconUpload size={32} color="violet" />
                      </Dropzone.Accept>
                      <Dropzone.Reject>
                        <IconX size={32} color="red" />
                      </Dropzone.Reject>
                      <Dropzone.Idle>
                        <IconPhoto size={32} color="gray" />
                      </Dropzone.Idle>
                      <Text size="sm" c="dimmed" ta="center">
                        Drag an image here or click to select
                        <br />
                        <Text span size="xs">
                          PNG, JPG, WebP — max 5 MB
                        </Text>
                      </Text>
                    </Stack>
                  </Center>
                </Dropzone>
              )}
            </div>

            <Button type="submit" loading={loading} mt="xs">
              Create product
            </Button>
          </Stack>
        </form>
      </Paper>
    </Stack>
  );
}
