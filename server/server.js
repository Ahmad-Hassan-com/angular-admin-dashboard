// Mock REST API with real JWT auth (bcrypt passwords, signed tokens, role claims).
// Data lives in server/db.json and is generated on first run by seed.js.
// On serverless hosts (Vercel) the filesystem is read-only, so data is kept in memory instead.
const fs = require('node:fs');
const path = require('node:path');
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { seed } = require('./seed');

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-secret-change-me';
const TOKEN_TTL = '2h';
const DB_FILE = path.join(__dirname, 'db.json');

const PERSIST = !process.env.VERCEL;

if (PERSIST && !fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify(seed(), null, 2));
  console.log('Seeded server/db.json');
}
const db = PERSIST ? JSON.parse(fs.readFileSync(DB_FILE, 'utf8')) : seed();
const save = () => PERSIST && fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));

const toPublic = ({ passwordHash, ...user }) => user;
const sign = (user) =>
  jwt.sign({ sub: user.id, email: user.email, name: user.name, role: user.role }, JWT_SECRET, {
    expiresIn: TOKEN_TTL,
  });

const app = express();
app.use(cors());
app.use(express.json());

// Small artificial latency so loading states are visible.
app.use('/api', (req, res, next) => setTimeout(next, 250));

// The two demo logins are shared by every visitor of the public demo, so nobody can lock others out.
const DEMO_IDS = new Set([1, 2]);
const protectDemo = (req, res, next) =>
  DEMO_IDS.has(Number(req.params.id))
    ? res.status(403).json({ message: 'Demo accounts are read-only. Try another user.' })
    : next();

function requireAuth(req, res, next) {
  const [scheme, token] = (req.headers.authorization || '').split(' ');
  if (scheme !== 'Bearer' || !token) return res.status(401).json({ message: 'Missing token' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
}

const requireRole = (role) => (req, res, next) =>
  req.user.role === role ? next() : res.status(403).json({ message: 'Forbidden' });

app.get('/api/health', (req, res) => res.json({ ok: true }));

// ---------- Auth ----------
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  const user = db.users.find((u) => u.email.toLowerCase() === String(email).toLowerCase());
  if (!user || !user.passwordHash || !bcrypt.compareSync(String(password), user.passwordHash)) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }
  if (user.status === 'suspended') return res.status(403).json({ message: 'Account suspended' });
  user.lastLogin = new Date().toISOString();
  save();
  res.json({ token: sign(user), user: toPublic(user) });
});

app.post('/api/auth/register', (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || !email || !password || String(password).length < 6) {
    return res.status(400).json({ message: 'Name, email and a 6+ character password are required' });
  }
  if (db.users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
    return res.status(409).json({ message: 'Email is already registered' });
  }
  const user = {
    id: Math.max(...db.users.map((u) => u.id)) + 1,
    name,
    email,
    role: 'user', // self-registration never grants admin
    status: 'active',
    department: 'Unassigned',
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
    passwordHash: bcrypt.hashSync(password, 10),
  };
  db.users.push(user);
  save();
  res.status(201).json({ token: sign(user), user: toPublic(user) });
});

app.get('/api/auth/me', requireAuth, (req, res) => {
  const user = db.users.find((u) => u.id === req.user.sub);
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(toPublic(user));
});

// ---------- Users (admin) ----------
// Supports ?q=&role=&status=&_sort=&_order=asc|desc&_page=1&_limit=10
app.get('/api/users', requireAuth, requireRole('admin'), (req, res) => {
  const { q = '', role, status, _sort = 'id', _order = 'asc' } = req.query;
  const page = Math.max(1, parseInt(req.query._page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query._limit, 10) || 10));
  const needle = String(q).toLowerCase();

  let rows = db.users.filter(
    (u) =>
      (!needle ||
        u.name.toLowerCase().includes(needle) ||
        u.email.toLowerCase().includes(needle) ||
        u.department.toLowerCase().includes(needle)) &&
      (!role || u.role === role) &&
      (!status || u.status === status),
  );
  const dir = _order === 'desc' ? -1 : 1;
  rows = rows.sort((a, b) => (a[_sort] > b[_sort] ? dir : a[_sort] < b[_sort] ? -dir : 0));

  res.set('X-Total-Count', String(rows.length));
  res.set('Access-Control-Expose-Headers', 'X-Total-Count');
  res.json(rows.slice((page - 1) * limit, page * limit).map(toPublic));
});

app.patch('/api/users/:id', requireAuth, requireRole('admin'), protectDemo, (req, res) => {
  const user = db.users.find((u) => u.id === Number(req.params.id));
  if (!user) return res.status(404).json({ message: 'User not found' });
  const { name, role, status, department } = req.body || {};
  if (user.id === req.user.sub && (role === 'user' || status === 'suspended')) {
    return res.status(400).json({ message: 'You cannot demote or suspend yourself' });
  }
  Object.assign(
    user,
    Object.fromEntries(Object.entries({ name, role, status, department }).filter(([, v]) => v !== undefined)),
  );
  save();
  res.json(toPublic(user));
});

app.delete('/api/users/:id', requireAuth, requireRole('admin'), protectDemo, (req, res) => {
  const id = Number(req.params.id);
  if (id === req.user.sub) return res.status(400).json({ message: 'You cannot delete yourself' });
  const index = db.users.findIndex((u) => u.id === id);
  if (index === -1) return res.status(404).json({ message: 'User not found' });
  db.users.splice(index, 1);
  save();
  res.status(204).end();
});

// ---------- Sales ----------
app.get('/api/sales', requireAuth, (req, res) => res.json(db.sales));

app.get('/api/stats', requireAuth, (req, res) => {
  const current = db.sales.monthly.map((m) => m.revenue);
  const previous = db.sales.monthly.map((m) => m.previousRevenue);
  const sum = (xs) => xs.reduce((a, b) => a + b, 0);
  res.json({
    revenue: sum(current),
    revenueChange: (sum(current) - sum(previous)) / sum(previous),
    orders: sum(db.sales.monthly.map((m) => m.orders)),
    activeUsers: db.users.filter((u) => u.status === 'active').length,
    totalUsers: db.users.length,
  });
});

// ---------- Angular app (production) ----------
// After `ng build`, the same server hosts the SPA so the whole demo is one URL.
const DIST = path.join(__dirname, '..', 'dist', 'admin-dashboard', 'browser');
if (fs.existsSync(DIST)) {
  app.use(express.static(DIST, { index: false, maxAge: '1y', immutable: true }));
  app.use('/api', (req, res) => res.status(404).json({ message: 'Not found' }));
  // Client-side routes (/dashboard, /users, ...) all get index.html.
  app.get('/{*path}', (req, res) => res.set('Cache-Control', 'no-cache').sendFile(path.join(DIST, 'index.html')));
}

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`API ready on http://localhost:${PORT}/api`);
    console.log('Demo accounts: admin@demo.com / admin123, user@demo.com / user123');
  });
}

module.exports = app;
