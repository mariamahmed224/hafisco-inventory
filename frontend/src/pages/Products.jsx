import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/client';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';

const emptyForm = {
  product_name: '',
  product_code: '',
  category_id: '',
  description: '',
  colour: '',
  size: '',
  quantity: 0,
  minimum_stock_level: 0,
};

export default function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (categoryId) params.category_id = categoryId;
      const [prodRes, catRes] = await Promise.all([
        api.get('/products', { params }),
        api.get('/categories'),
      ]);
      setProducts(prodRes.data);
      setCategories(catRes.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      openCreate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (product) => {
    setEditing(product);
    setForm({
      product_name: product.product_name || '',
      product_code: product.product_code || '',
      category_id: product.category_id || '',
      description: product.description || '',
      colour: product.colour || '',
      size: product.size || '',
      quantity: product.quantity,
      minimum_stock_level: product.minimum_stock_level || 0,
    });
    setModalOpen(true);
  };

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const payload = {
        product_name: form.product_name,
        product_code: form.product_code || null,
        category_id: form.category_id || null,
        description: form.description || null,
        colour: form.colour || null,
        size: form.size || null,
        minimum_stock_level: Number(form.minimum_stock_level) || 0,
      };
      if (!editing) {
        payload.quantity = Number(form.quantity) || 0;
        await api.post('/products', payload);
        setSuccess('Product created.');
      } else {
        await api.put(`/products/${editing.id}`, payload);
        setSuccess('Product updated.');
      }
      setModalOpen(false);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (product) => {
    if (!window.confirm(`Delete "${product.product_name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/products/${product.id}`);
      setSuccess('Product deleted.');
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Products</h1>
          <p>Create, search, and manage stock items.</p>
        </div>
        <div className="header-actions">
          <button type="button" className="btn" onClick={openCreate}>
            Add Product
          </button>
        </div>
      </div>

      {error ? <div className="alert alert-error">{error}</div> : null}
      {success ? <div className="alert alert-success">{success}</div> : null}

      <div className="toolbar">
        <div className="field field-inline">
          <label htmlFor="search">Search by name / SKU</label>
          <input
            id="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="e.g. mouse"
          />
        </div>
        <div className="field field-inline">
          <label htmlFor="category">Category</label>
          <select
            id="category"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.category_name}
              </option>
            ))}
          </select>
        </div>
        <div className="field" style={{ justifyContent: 'flex-end' }}>
          <label>&nbsp;</label>
          <button type="button" className="btn btn-secondary" onClick={load}>
            Apply filters
          </button>
        </div>
      </div>

      <div className="panel">
        <div className="table-wrap">
          {loading ? (
            <p className="empty">Loading…</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Category</th>
                  <th>Colour</th>
                  <th>Size</th>
                  <th>Qty</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="empty">
                      No products found.
                    </td>
                  </tr>
                ) : (
                  products.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <Link to={`/products/${p.id}`}>{p.product_name}</Link>
                      </td>
                      <td>{p.product_code || '—'}</td>
                      <td>{p.category_name || '—'}</td>
                      <td>{p.colour || '—'}</td>
                      <td>{p.size || '—'}</td>
                      <td>{p.quantity}</td>
                      <td>
                        <StatusBadge status={p.stock_status} />
                      </td>
                      <td>
                        <div className="row-actions">
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => openEdit(p)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => navigate(`/stock?product=${p.id}`)}
                          >
                            Stock
                          </button>
                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            onClick={() => remove(p)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {modalOpen ? (
        <Modal
          title={editing ? 'Edit product' : 'Add product'}
          onClose={() => setModalOpen(false)}
          footer={
            <>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setModalOpen(false)}
              >
                Cancel
              </button>
              <button type="submit" form="product-form" className="btn" disabled={saving}>
                {saving ? 'Saving…' : 'Save'}
              </button>
            </>
          }
        >
          <form id="product-form" className="form-grid" onSubmit={save}>
            <div className="field span-2">
              <label htmlFor="product_name">Product name *</label>
              <input
                id="product_name"
                name="product_name"
                value={form.product_name}
                onChange={onChange}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="product_code">SKU / product code</label>
              <input
                id="product_code"
                name="product_code"
                value={form.product_code}
                onChange={onChange}
              />
            </div>
            <div className="field">
              <label htmlFor="category_id">Category</label>
              <select
                id="category_id"
                name="category_id"
                value={form.category_id}
                onChange={onChange}
              >
                <option value="">None</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.category_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="colour">Colour</label>
              <input
                id="colour"
                name="colour"
                value={form.colour}
                onChange={onChange}
                placeholder="e.g. Navy"
              />
            </div>
            <div className="field">
              <label htmlFor="size">Size</label>
              <input id="size" name="size" value={form.size} onChange={onChange} />
            </div>
            {!editing ? (
              <div className="field">
                <label htmlFor="quantity">Quantity *</label>
                <input
                  id="quantity"
                  name="quantity"
                  type="number"
                  min="0"
                  value={form.quantity}
                  onChange={onChange}
                  required
                />
              </div>
            ) : (
              <div className="field">
                <label>Quantity</label>
                <input value={form.quantity} disabled />
                <small style={{ color: 'var(--ink-muted)' }}>
                  Change quantity via Stock In / Out / Adjustment.
                </small>
              </div>
            )}
            <div className="field">
              <label htmlFor="minimum_stock_level">Minimum stock level</label>
              <input
                id="minimum_stock_level"
                name="minimum_stock_level"
                type="number"
                min="0"
                value={form.minimum_stock_level}
                onChange={onChange}
              />
            </div>
            <div className="field span-2">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                value={form.description}
                onChange={onChange}
              />
            </div>
          </form>
        </Modal>
      ) : null}
    </div>
  );
}
