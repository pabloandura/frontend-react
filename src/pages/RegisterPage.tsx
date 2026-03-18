import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Anchor,
  Button,
  Center,
  Paper,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import client from '../api/client';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const form = useForm({
    initialValues: { name: '', email: '', password: '' },
    validate: {
      name: (v) => (v.trim().length > 0 ? null : 'Name is required'),
      email: (v) => (/^\S+@\S+\.\S+$/.test(v) ? null : 'Enter a valid email'),
      password: (v) => (v.length >= 8 ? null : 'Password must be at least 8 characters'),
    },
  });

  async function handleSubmit(values: typeof form.values) {
    setLoading(true);
    try {
      await client.post('/auth/register', values);
      notifications.show({
        color: 'green',
        title: 'Account created',
        message: 'You can now sign in.',
      });
      navigate('/login');
    } catch {
      notifications.show({
        color: 'red',
        title: 'Registration failed',
        message: 'That email may already be in use.',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Center mih="100svh" p="md">
      <Paper w="100%" maw={400} p="xl" shadow="md" radius="md" withBorder>
        <Stack gap="lg">
          <Title order={2} ta="center">
            Create account
          </Title>

          <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack gap="sm">
              <TextInput
                label="Name"
                placeholder="Your name"
                {...form.getInputProps('name')}
              />
              <TextInput
                label="Email"
                type="email"
                placeholder="you@example.com"
                {...form.getInputProps('email')}
              />
              <PasswordInput
                label="Password"
                placeholder="At least 8 characters"
                {...form.getInputProps('password')}
              />
              <Button type="submit" loading={loading} fullWidth mt="xs">
                Create account
              </Button>
            </Stack>
          </form>

          <Text ta="center" size="sm">
            Already have an account?{' '}
            <Anchor component={Link} to="/login">
              Sign in
            </Anchor>
          </Text>
        </Stack>
      </Paper>
    </Center>
  );
}
