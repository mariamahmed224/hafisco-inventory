import { useEffect, useState } from 'react';
import api from '../api/client';
import StatusBadge from '../components/StatusBadge';

const TABS = [
  { id: 'products', label: 'All products', endpoint: '/reports/products' },
  { id: 'low', label: 'Low stock', endpoint: '/reports/low-stock' },
  { id: 'out', label: 'Out of stock', endpoint: '/reports/out-of-stock' },
  { id: 'movements', label: 'Movements', endpoint: '/reports/movements' },
];

function downloadBlob(content, filename, mime = 'text/csv;charset=utf-8') {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function toCsv(rows, columns) {
  const escape = (val) => {
    if (val === null || val === undefined) return '';
    const str = String(val);
    if (/[",\n\r]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
    return str;
  };
  const header = columns.map((c) => c.label).join(',');
  const lines = rows.map((row) => columns.map((c) => escape(row[c.key])).join(','));
  return [header, ...lines].join('\n');
}

export default function Reports() {
  const [tab, setTab] = useState(TABS[0]);
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    load(TABS[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const load = async (selected = tab) => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(selected.endpoint);
      setRows(res.data);
    } catch (err) {
      setError(err.message);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  const onTab = async (next) => {
    setTab(next);
    await load(next);
  };

  const exportCsv = async () => {
    try {
      // Prefer server CSV for consistency
      const res = await api.get(tab.endpoint, {
        params: { format: 'csv' },
        responseType: 'text',
        transformResponse: [(data) => data],
      });
      downloadBlob(res.data, `${tab.id}-report.csv`);
    } catch (err) {
      // Fallback: build CSV client-side from loaded rows
      if (!rows.length) {
        setError(err.message);
        return;
      }
      const cols =
        tab.id === 'movements'
          ? [
              { label: 'Product', key: 'product_name' },
              { label: 'SKU', key: 'product_code' },
              { label: 'Type', key: 'movement_type' },
              { label: 'Qty', key: 'quantity' },
              { label: 'Remarks', key: 'remarks' },
              { label: 'DateTime', key: 'created_at' },
            ]
          : [
              { label: 'Product', key: 'product_name' },
              { label: 'SKU', key: 'product_code' },
              { label: 'Category', key: 'category_name' },
              { label: 'Qty', key: 'quantity' },
              { label: 'Min', key: 'minimum_stock_level' },
              { label: 'Status', key: 'stock_status' },
            ];
      downloadBlob(toCsv(rows, cols), `${tab.id}-report.csv`);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Reports</h1>
          <p>Stock lists and movement history. Export as CSV (Excel-compatible).</p>
        </div>
        <div className="header-actions">
          <button type="button" className="btn btn-secondary" onClick={() => load()}>
            Refresh
          </button>
          <button type="button" className="btn" onClick={exportCsv} disabled={!rows.length && !loading}>
            Export CSV
          </button>
        </div>
      </div>

      <div className="tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`tab ${tab.id === t.id ? 'active' : ''}`}
            onClick={() => onTab(t)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error ? <div className="alert alert-error">{error}</div> : null}

      <div className="panel">
        <div className="panel-header">
          <h2>{tab.label}</h2>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => load()}>
            Load report
          </button>
        </div>
        <div className="table-wrap">
          {loading ? (
            <p className="empty">Loading…</p>
          ) : tab.id === 'movements' ? (
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
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="empty">
                      Click “Load report” to view data, or switch tabs.
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => (
                    <tr key={r.id}>
                      <td>{r.product_name}</td>
                      <td>{r.movement_type}</td>
                      <td>{r.quantity}</td>
                      <td>{r.remarks || '—'}</td>
                      <td>{new Date(r.created_at).toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Category</th>
                  <th>Qty</th>
                  <th>Min</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="empty">
                      Click “Load report” to view data, or switch tabs.
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => (
                    <tr key={r.id}>
                      <td>{r.product_name}</td>
                      <td>{r.product_code || '—'}</td>
                      <td>{r.category_name || '—'}</td>
                      <td>{r.quantity}</td>
                      <td>{r.minimum_stock_level}</td>
                      <td>
                        <StatusBadge status={r.stock_status} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
