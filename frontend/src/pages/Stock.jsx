import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/client';

const emptyForm = {
  product_id: '',
  movement_type: 'IN',
  quantity: 1,
  remarks: '',
};

export default function Stock() {
  const [products, setProducts] = useState([]);
  const [movements, setMovements] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);
  const [searchParams] = useSearchParams();

  const load = async () => {
    setError('');
    try {
      const [pRes, mRes] = await Promise.all([
        api.get('/products'),
        api.get('/stock/movements', { params: { limit: 100 } }),
      ]);
      setProducts(pRes.data);
      setMovements(mRes.data);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const product = searchParams.get('product');
    if (product) {
      setForm((f) => ({ ...f, product_id: product }));
    }
  }, [searchParams]);

  const selected = products.find((p) => String(p.id) === String(form.product_id));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await api.post('/stock/movements', {
        product_id: Number(form.product_id),
        movement_type: form.movement_type,
        quantity: Number(form.quantity),
        remarks: form.remarks || null,
      });
      setSuccess('Stock updated successfully.');
      setForm((f) => ({ ...f, quantity: 1, remarks: '' }));
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Stock management</h1>
          <p>Record Stock In, Stock Out, or Adjustment. Negative stock is blocked.</p>
        </div>
      </div>

      {error ? <div className="alert alert-error">{error}</div> : null}
      {success ? <div className="alert alert-success">{success}</div> : null}

      <div className="panel" style={{ marginBottom: '1.25rem' }}>
        <div className="panel-header">
          <h2>Record movement</h2>
        </div>
        <form onSubmit={submit} className="modal-body">
          <div className="form-grid">
            <div className="field span-2">
              <label htmlFor="product_id">Product *</label>
              <select
                id="product_id"
                value={form.product_id}
                onChange={(e) => setForm((f) => ({ ...f, product_id: e.target.value }))}
                required
              >
                <option value="">Select a product</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.product_name} (qty: {p.quantity})
                  </option>
                ))}
              </select>
              {selected ? (
                <small style={{ color: 'var(--ink-muted)' }}>
                  Current quantity: {selected.quantity} · Min level: {selected.minimum_stock_level} ·{' '}
                  {selected.stock_status}
                </small>
              ) : null}
            </div>
            <div className="field">
              <label htmlFor="movement_type">Type *</label>
              <select
                id="movement_type"
                value={form.movement_type}
                onChange={(e) => setForm((f) => ({ ...f, movement_type: e.target.value }))}
              >
                <option value="IN">Stock In</option>
                <option value="OUT">Stock Out</option>
                <option value="ADJUSTMENT">Adjustment (set absolute qty)</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="quantity">
                {form.movement_type === 'ADJUSTMENT' ? 'New quantity *' : 'Quantity *'}
              </label>
              <input
                id="quantity"
                type="number"
                min={form.movement_type === 'ADJUSTMENT' ? 0 : 1}
                value={form.quantity}
                onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
                required
              />
            </div>
            <div className="field span-2">
              <label htmlFor="remarks">Remarks</label>
              <input
                id="remarks"
                value={form.remarks}
                onChange={(e) => setForm((f) => ({ ...f, remarks: e.target.value }))}
                placeholder="Optional note"
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
            <button type="submit" className="btn" disabled={saving}>
              {saving ? 'Saving…' : 'Submit movement'}
            </button>
          </div>
        </form>
      </div>

      <div className="panel">
        <div className="panel-header">
          <h2>Movement history</h2>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Type</th>
                <th>Qty</th>
                <th>Remarks</th>
                <th>Date / time</th>
              </tr>
            </thead>
            <tbody>
              {movements.length === 0 ? (
                <tr>
                  <td colSpan={5} className="empty">
                    No movements recorded.
                  </td>
                </tr>
              ) : (
                movements.map((m) => (
                  <tr key={m.id}>
                    <td>
                      {m.product_name}
                      {m.product_code ? (
                        <div style={{ color: 'var(--ink-muted)', fontSize: '0.85rem' }}>
                          {m.product_code}
                        </div>
                      ) : null}
                    </td>
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
