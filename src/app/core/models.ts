export type Role = 'admin' | 'user';
export type UserStatus = 'active' | 'pending' | 'suspended';

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  status: UserStatus;
  department: string;
  createdAt: string;
  lastLogin: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface JwtPayload {
  sub: number;
  email: string;
  name: string;
  role: Role;
  iat: number;
  exp: number;
}

export interface UserQuery {
  q: string;
  role: Role | '';
  status: UserStatus | '';
  sort: keyof User;
  order: 'asc' | 'desc' | '';
  pageIndex: number;
  pageSize: number;
}

export interface Page<T> {
  items: T[];
  total: number;
}

export interface MonthlySales {
  month: string;
  revenue: number;
  previousRevenue: number;
  orders: number;
}

export interface SalesData {
  monthly: MonthlySales[];
  byCategory: { category: string; revenue: number }[];
  byRegion: { region: string; revenue: number }[];
}

export interface Stats {
  revenue: number;
  revenueChange: number;
  orders: number;
  activeUsers: number;
  totalUsers: number;
}
