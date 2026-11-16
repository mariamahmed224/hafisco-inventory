import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../api/client';
import StatusBadge from '../components/StatusBadge';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [movements, setMovements] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [pRes, mRes] = await Promise.all([
          api.get(`/products/${id}`),
          api.get('/stock/movements', { params: { product_id: id, limit: 50 } }),
        ]);
        if (!cancelled) {
          setProduct(pRes.data);
          setMovements(mRes.data);
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) return <p>Loading…</p>;
  if (error) return <div className="alert alert-error">{error}</div>;
  if (!product) return null;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>{product.product_name}</h1>
          <p>Product detail and recent stock movement.</p>
        </div>
        <div className="header-actions">
          <Link className="btn btn-secondary" to="/products">
            Back
          </Link>
          <button
            type="button"
            className="btn"
            onClick={() => navigate(`/stock?product=${product.id}`)}
          >
            Stock In / Out
          </button>
        </div>
      </div>

      <div className="detail-grid" style={{ marginBottom: '1.25rem' }}>
        <div className="detail-item">
          <div className="k">SKU</div>
          <div className="v">{product.product_code || '—'}</div>
        </div>
        <div className="detail-item">
          <div className="k">Category</div>
          <div className="v">{product.category_name || '—'}</div>
        </div>
        <div className="detail-item">
          <div className="k">Quantity</div>
          <div className="v">{product.quantity}</div>
        </div>
        <div className="detail-item">
          <div className="k">Status</div>
          <div className="v">
            <StatusBadge status={product.stock_status} />
          </div>
        </div>
        <div className="detail-item">
          <div className="k">Colour</div>
          <div className="v">{product.colour || '—'}</div>
        </div>
        <div className="detail-item">
          <div className="k">Size</div>
          <div className="v">{product.size || '—'}</div>
        </div>
        <div className="detail-item">
          <div className="k">Minimum stock</div>
          <div className="v">{product.minimum_stock_level}</div>
        </div>
        <div className="detail-item">
          <div className="k">Updated</div>
          <div className="v">{new Date(product.updated_at).toLocaleString()}</div>
        </div>
        <div className="detail-item" style={{ gridColumn: '1 / -1' }}>
          <div className="k">Description</div>
          <div className="v">{product.description || '—'}</div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <h2>Movement history</h2>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Type</th>
                <th>Qty</th>
                <th>Remarks</th>
                <th>Date / time</th>
              </tr>
            </thead>
            <tbody>
              {movements.length === 0 ? (
                <tr>
                  <td colSpan={4} className="empty">
                    No movements yet.
                  </td>
                </tr>
              ) : (
                movements.map((m) => (
                  <tr key={m.id}>
                    <td>
                      <span className="badge badge-neutral">{m.movement_type}</span>
                    </td>
                    <td>{m.quantity}</td>
                    <td>{m.remarks || '—'}</td>
                    <td>{new Date(m.created_at).toLocaleString()}</td>
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
