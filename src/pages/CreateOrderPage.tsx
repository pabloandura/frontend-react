import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const [clientName, setClientName] = useState('');
  const [items, setItems] = useState<OrderItem[]>([{ productId: '', quantity: 1 }]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [confirmedOrderId, setConfirmedOrderId] = useState('');

  useEffect(() => {
    client
      .get<{ data: Product[] }>('/products', { params: { limit: 100 } })
      .then(({ data }) => setProducts(data.data));
  }, []);

  function addItem() {
    setItems((prev) => [...prev, { productId: '', quantity: 1 }]);
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function updateItem(index: number, field: keyof OrderItem, value: string | number) {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    );
  }

  function runningTotal(): number {
    return items.reduce((sum, item) => {
      const product = products.find((p) => p.id === item.productId);
      if (!product || item.quantity < 1) return sum;
      return Math.round((sum + product.price * item.quantity) * 100) / 100;
    }, 0);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const validItems = items.filter((i) => i.productId && i.quantity > 0);
    if (!validItems.length) {
      setError('Add at least one product with a valid quantity.');
      return;
    }

    setSubmitting(true);
    try {
      const { data } = await client.post<{ data: { id: string } }>('/orders', {
        clientName,
        items: validItems.map((i) => ({ productId: i.productId, quantity: Number(i.quantity) })),
      });
      setConfirmedOrderId(data.data.id);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
          ?.message ?? 'Failed to create order.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  if (confirmedOrderId) {
    return (
      <main>
        <h1>Order confirmed!</h1>
        <p>Order ID: <strong>{confirmedOrderId}</strong></p>
        <button onClick={() => navigate('/products')}>Back to Products</button>
        {' '}
        <button onClick={() => { setConfirmedOrderId(''); setItems([{ productId: '', quantity: 1 }]); setClientName(''); }}>
          Create another
        </button>
      </main>
    );
  }

  return (
    <main>
      <h1>Create Order</h1>
      <form onSubmit={handleSubmit}>
        <label>
          Client name
          <input
            type="text"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            required
            minLength={1}
          />
        </label>

        <h2>Products</h2>
        {items.map((item, index) => (
          <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
            <select
              value={item.productId}
              onChange={(e) => updateItem(index, 'productId', e.target.value)}
              required
            >
              <option value="">— select product —</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku}) — ${p.price.toFixed(2)}
                </option>
              ))}
            </select>
            <input
              type="number"
              min={1}
              value={item.quantity}
              onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value, 10))}
              style={{ width: '70px' }}
              required
            />
            {items.length > 1 && (
              <button type="button" onClick={() => removeItem(index)}>✕</button>
            )}
          </div>
        ))}

        <button type="button" onClick={addItem}>+ Add product</button>

        <p>
          <strong>Running total: ${runningTotal().toFixed(2)}</strong>
        </p>

        {error && <p role="alert" style={{ color: 'red' }}>{error}</p>}

        <button type="submit" disabled={submitting}>
          {submitting ? 'Placing order…' : 'Place order'}
        </button>
      </form>
    </main>
  );
}
