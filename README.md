# Frontend — React + Vite

Minimal secure SPA that exercises every frontend acceptance criterion: JWT auth flow, paginated product browsing, order creation with a running total, and a reporting dashboard.

## Stack

- **React 18** + **TypeScript** + **Vite 5**
- **React Router v6** for client-side routing
- **Axios** with an auth interceptor
- **Nginx** for the production static build (with `/api` proxy and security headers)

## Structure

```
src/
├── api/client.ts            ← Axios instance, Bearer token interceptor
├── context/AuthContext.tsx  ← JWT state, login/logout, sessionStorage
├── components/
│   └── ProtectedRoute.tsx   ← Redirects to /login if not authenticated
└── pages/
    ├── LoginPage.tsx
    ├── ProductsPage.tsx
    ├── CreateOrderPage.tsx
    └── ReportsPage.tsx
```

---

## Acceptance Criteria Coverage

### FE-01 — Login form, JWT stored, redirect to dashboard (P0)
> Unauthenticated user → login form → JWT in memory → redirect

`AuthContext` stores the access token in `sessionStorage` (in-memory for SPA — survives navigation but not a new tab, which limits XSS surface area):

```typescript
// src/context/AuthContext.tsx
const login = async (email: string, password: string) => {
  const { data } = await client.post('/auth/login', { email, password });
  const token = data.data.accessToken;
  sessionStorage.setItem('accessToken', token);
  setIsAuthenticated(true);
};
```

[`src/pages/LoginPage.tsx`](src/pages/LoginPage.tsx) calls `auth.login()` and navigates to `/products` on success.

`ProtectedRoute` at [`src/components/ProtectedRoute.tsx`](src/components/ProtectedRoute.tsx) wraps every authenticated route and redirects to `/login` when `isAuthenticated` is false. Wired in [`src/App.tsx:32`](src/App.tsx#L32):

```tsx
// src/App.tsx:32
<Route path="/products" element={<ProtectedRoute><ProductsPage /></ProtectedRoute>} />
```

---

### FE-02 — Paginated, searchable product list (P0)
> Authenticated user → Products page → paginated, searchable list from API

[`src/pages/ProductsPage.tsx`](src/pages/ProductsPage.tsx) drives `page` state with Prev/Next buttons and passes `?search=` as a query param when the user types in the search box. The API response envelope `meta.total` and `meta.totalPages` are used to compute button disabled states and show pagination info.

Key call (illustrative):
```typescript
// src/pages/ProductsPage.tsx
client.get('/products', { params: { page, limit: 10, search } })
  .then(({ data }) => {
    setProducts(data.data);
    setMeta(data.meta);
  });
```

---

### FE-03 — Create order with running total and confirmation (P1)
> Select products, see running total, submit → confirmation with order ID

[`src/pages/CreateOrderPage.tsx`](src/pages/CreateOrderPage.tsx) manages a dynamic list of `{ productId, quantity }` line items. The running total is calculated client-side against the fetched product prices:

```typescript
// src/pages/CreateOrderPage.tsx:46
function runningTotal(): number {
  return items.reduce((sum, item) => {
    const product = products.find((p) => p.id === item.productId);
    if (!product || item.quantity < 1) return sum;
    return Math.round((sum + product.price * item.quantity) * 100) / 100;
  }, 0);
}
```

On success, `confirmedOrderId` is set and a confirmation screen shows the order ID alongside "Back to Products" and "Create another" actions ([`src/pages/CreateOrderPage.tsx:81`](src/pages/CreateOrderPage.tsx#L81)).

---

### FE-04 — Reports page (P1)
> Total sold last month + highest order from reporting endpoints

[`src/pages/ReportsPage.tsx`](src/pages/ReportsPage.tsx) fires two concurrent requests on mount:
- `GET /orders/reports/total-last-month` → `{ period, total }`
- `GET /orders/reports/highest` → highest order document

Both results are displayed with their computed values.

---

### FE-05 — Nginx production build with security headers and API proxy (P0)
> Static build served by Nginx, /api/* proxied to backend, security headers set

[`nginx/default.conf`](nginx/default.conf) configures:

```nginx
# nginx/default.conf
add_header X-Frame-Options "SAMEORIGIN";
add_header X-Content-Type-Options "nosniff";
add_header Content-Security-Policy "default-src 'self'; ...";

location /api/ {
    proxy_pass http://api:3000/;
}

location / {
    try_files $uri $uri/ /index.html;  # SPA fallback
}
```

The `production` stage of [`Dockerfile`](Dockerfile) copies the Vite build output to `/usr/share/nginx/html` and applies the custom Nginx config:

```dockerfile
# Dockerfile:19
FROM nginx:1.27-alpine AS production
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx/default.conf /etc/nginx/conf.d/default.conf
```

---

## Auth Token Flow

```
LoginPage → AuthContext.login()
           ↓
    POST /api/auth/login
           ↓
    accessToken → sessionStorage
           ↓
    Axios interceptor (src/api/client.ts)
    attaches Authorization: Bearer <token>
    on every subsequent request
```

The interceptor in [`src/api/client.ts`](src/api/client.ts) reads from `sessionStorage` before each request, so the token is always current without manual plumbing in components.

---

## Development

```bash
# From superproject root:
docker compose -f docker-compose.dev.yml up frontend --build
# → http://localhost:8080
# Vite proxy rewrites /api/* → http://api:3000/* (vite.config.ts)
```

The Vite dev proxy is configured in [`vite.config.ts`](vite.config.ts):

```typescript
// vite.config.ts
server: {
  host: true,
  proxy: { '/api': { target: 'http://api:3000', rewrite: (p) => p.replace(/^\/api/, '') } },
}
```
