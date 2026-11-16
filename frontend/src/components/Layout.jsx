import { NavLink, Outlet } from 'react-router-dom';
import { useState } from 'react';

const links = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/products', label: 'Products' },
  { to: '/categories', label: 'Categories' },
  { to: '/stock', label: 'Stock' },
  { to: '/reports', label: 'Reports' },
];

export default function Layout() {
  const [open, setOpen] = useState(false);

  return (
    <div className="app-shell">
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="brand">
          <div className="brand-mark">HAFISCO</div>
          <div className="brand-sub">Inventory Management</div>
        </div>
        <nav className="nav" onClick={() => setOpen(false)}>
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.end}>
              {link.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="main">
        <button
          type="button"
          className="btn btn-secondary btn-sm mobile-toggle"
          onClick={() => setOpen((v) => !v)}
          style={{ marginBottom: '0.75rem' }}
        >
          Menu
        </button>
        <Outlet />
      </div>
    </div>
  );
}
