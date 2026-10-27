// Deterministic demo data: two loginable accounts, 70 directory users, 12 months of sales.
const bcrypt = require('bcryptjs');

function rng(seed) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

function seed() {
  const rand = rng(42);
  const pick = (xs) => xs[Math.floor(rand() * xs.length)];
  const first = ['Ava', 'Liam', 'Noah', 'Mia', 'Zara', 'Omar', 'Sara', 'Ali', 'Hina', 'Leo', 'Ivy', 'Kai',
    'Nora', 'Ravi', 'Emma', 'Yusuf', 'Aisha', 'Lucas', 'Maya', 'Ethan', 'Fatima', 'Hamza', 'Chloe', 'Daniel'];
  const last = ['Khan', 'Smith', 'Garcia', 'Ahmed', 'Chen', 'Patel', 'Müller', 'Rossi', 'Silva', 'Kim',
    'Nguyen', 'Brown', 'Malik', 'Haddad', 'Novak', 'Okafor', 'Tanaka', 'Ilyas', 'Lopez', 'Wilson'];
  const departments = ['Sales', 'Marketing', 'Engineering', 'Support', 'Finance', 'Operations'];

  const daysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString();

  const users = [
    { id: 1, name: 'Admin Demo', email: 'admin@demo.com', role: 'admin', status: 'active',
      department: 'Operations', createdAt: daysAgo(400), lastLogin: daysAgo(0),
      passwordHash: bcrypt.hashSync('admin123', 10) },
    { id: 2, name: 'User Demo', email: 'user@demo.com', role: 'user', status: 'active',
      department: 'Sales', createdAt: daysAgo(200), lastLogin: daysAgo(1),
      passwordHash: bcrypt.hashSync('user123', 10) },
  ];
  for (let id = 3; id <= 72; id++) {
    const f = pick(first);
    const l = pick(last);
    users.push({
      id,
      name: `${f} ${l}`,
      email: `${f}.${l}${id}@example.com`.toLowerCase().replace('ü', 'u'),
      role: rand() < 0.15 ? 'admin' : 'user',
      status: rand() < 0.82 ? 'active' : rand() < 0.5 ? 'pending' : 'suspended',
      department: pick(departments),
      createdAt: daysAgo(Math.floor(rand() * 700) + 2),
      lastLogin: daysAgo(Math.floor(rand() * 60)),
      passwordHash: null, // directory-only users can't log in
    });
  }

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthly = months.map((month, i) => {
    const season = 1 + 0.25 * Math.sin((i / 12) * Math.PI * 2 - 1) + (i >= 10 ? 0.35 : 0);
    const previousRevenue = Math.round((38000 + rand() * 6000) * season);
    const revenue = Math.round(previousRevenue * (1.06 + rand() * 0.14));
    return { month, revenue, previousRevenue, orders: Math.round(revenue / (72 + rand() * 10)) };
  });

  const byCategory = [
    { category: 'Electronics', revenue: 214300 },
    { category: 'Apparel', revenue: 151800 },
    { category: 'Home & Garden', revenue: 118400 },
    { category: 'Sports', revenue: 83200 },
    { category: 'Books', revenue: 41700 },
  ];
  const byRegion = [
    { region: 'North America', revenue: 236900 },
    { region: 'Europe', revenue: 172500 },
    { region: 'Asia Pacific', revenue: 131200 },
    { region: 'Middle East', revenue: 46400 },
    { region: 'Latin America', revenue: 22400 },
  ];

  return { users, sales: { monthly, byCategory, byRegion } };
}

module.exports = { seed };
