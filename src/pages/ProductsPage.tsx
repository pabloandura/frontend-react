import { useEffect, useState } from 'react';
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

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    client
      .get<ProductsResponse>('/products', {
        params: { page, limit: 10, ...(search ? { search } : {}) },
      })
      .then(({ data }) => {
        setProducts(data.data);
        setTotalPages(data.meta.totalPages);
      })
      .finally(() => setLoading(false));
  }, [page, search]);

  return (
    <main>
      <h1>Products</h1>
      <input
        type="search"
        placeholder="Search products…"
        value={search}
        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
      />
      {loading ? (
        <p>Loading…</p>
      ) : (
        <table>
          <thead>
            <tr><th>Name</th><th>SKU</th><th>Price</th></tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <td>{p.name}</td>
                <td>{p.sku}</td>
                <td>${p.price.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <div>
        <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</button>
        <span> Page {page} of {totalPages} </span>
        <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
      </div>
    </main>
  );
}
