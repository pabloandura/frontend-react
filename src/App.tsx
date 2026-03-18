import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  NavLink as RouterNavLink,
  useLocation,
} from 'react-router-dom';
import {
  AppShell,
  Burger,
  Group,
  NavLink,
  Stack,
  Button,
  Text,
  Loader,
  Center,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { modals } from '@mantine/modals';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CreateProductPage from './pages/CreateProductPage';
import CreateOrderPage from './pages/CreateOrderPage';
import ReportsPage from './pages/ReportsPage';

const NAV_LINKS = [
  { to: '/products', label: 'Products' },
  { to: '/orders/new', label: 'New Order' },
  { to: '/reports', label: 'Reports' },
];

function Shell({ children }: { children: React.ReactNode }) {
  const [opened, { toggle, close }] = useDisclosure(false);
  const { logout } = useAuth();
  const location = useLocation();

  function confirmLogout() {
    modals.openConfirmModal({
      title: 'Log out',
      children: <Text size="sm">Are you sure you want to log out?</Text>,
      labels: { confirm: 'Log out', cancel: 'Cancel' },
      confirmProps: { color: 'red' },
      onConfirm: logout,
    });
  }

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 260,
        breakpoint: 'sm',
        collapsed: { mobile: !opened, desktop: true },
      }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <Text fw={700} size="lg">
              eCommerce
            </Text>
          </Group>

          {/* Desktop nav — hidden on mobile */}
          <Group visibleFrom="sm" gap="xs">
            {NAV_LINKS.map(({ to, label }) => (
              <Button
                key={to}
                component={RouterNavLink}
                to={to}
                variant={location.pathname.startsWith(to) ? 'light' : 'subtle'}
                size="sm"
              >
                {label}
              </Button>
            ))}
            <Button variant="outline" color="red" size="sm" onClick={confirmLogout}>
              Logout
            </Button>
          </Group>
        </Group>
      </AppShell.Header>

      {/* Mobile drawer */}
      <AppShell.Navbar p="md">
        <Stack justify="space-between" h="100%">
          <Stack gap="xs">
            {NAV_LINKS.map(({ to, label }) => (
              <NavLink
                key={to}
                component={RouterNavLink}
                to={to}
                label={label}
                active={location.pathname.startsWith(to)}
                onClick={close}
              />
            ))}
          </Stack>
          <Button variant="outline" color="red" onClick={confirmLogout}>
            Logout
          </Button>
        </Stack>
      </AppShell.Navbar>

      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}

function AppRoutes() {
  const { isAuthenticated, initializing } = useAuth();

  if (initializing) {
    return (
      <Center mih="100svh">
        <Loader />
      </Center>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route
        path="/products"
        element={
          <ProtectedRoute>
            <Shell>
              <ProductsPage />
            </Shell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/products/new"
        element={
          <ProtectedRoute>
            <Shell>
              <CreateProductPage />
            </Shell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/products/:id"
        element={
          <ProtectedRoute>
            <Shell>
              <ProductDetailPage />
            </Shell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/orders/new"
        element={
          <ProtectedRoute>
            <Shell>
              <CreateOrderPage />
            </Shell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedRoute>
            <Shell>
              <ReportsPage />
            </Shell>
          </ProtectedRoute>
        }
      />

      <Route
        path="*"
        element={<Navigate to={isAuthenticated ? '/products' : '/login'} replace />}
      />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
