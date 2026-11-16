import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import StatusBadge from '../components/StatusBadge';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get('/dashboard');
        if (!cancelled) setData(res.data);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <p>Loading dashboard…</p>;
  if (error) return <div className="alert alert-error">{error}</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p>Stock overview for your inventory.</p>
        </div>
        <div className="header-actions">
          <Link className="btn" to="/products?new=1">
            Add Product
          </Link>
          <Link className="btn btn-secondary" to="/stock">
            Stock In / Out
          </Link>
        </div>
      </div>

      <div className="summary-grid">
        <div className="summary-card">
          <div className="label">Total products</div>
          <div className="value">{data.total_products}</div>
        </div>
        <div className="summary-card">
          <div className="label">Total stock qty</div>
          <div className="value">{data.total_stock_qty}</div>
        </div>
        <div className="summary-card">
          <div className="label">Low stock</div>
          <div className="value">{data.low_stock_count}</div>
        </div>
        <div className="summary-card">
          <div className="label">Out of stock</div>
          <div className="value">{data.out_of_stock_count}</div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <h2>Recently added products</h2>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Qty</th>
                <th>Status</th>
                <th>Added</th>
              </tr>
            </thead>
            <tbody>
              {data.recently_added.length === 0 ? (
                <tr>
                  <td colSpan={5} className="empty">
                    No products yet.
                  </td>
                </tr>
              ) : (
                data.recently_added.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <Link to={`/products/${p.id}`}>{p.product_name}</Link>
                    </td>
                    <td>{p.category_name || '—'}</td>
                    <td>{p.quantity}</td>
                    <td>
                      <StatusBadge status={p.stock_status} />
                    </td>
                    <td>{new Date(p.created_at).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
