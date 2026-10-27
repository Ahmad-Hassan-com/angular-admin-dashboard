import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { Page, SalesData, Stats, User, UserQuery } from '../models';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);

  /** Server-side search, filtering, sorting and pagination. */
  list(query: UserQuery): Observable<Page<User>> {
    let params = new HttpParams()
      .set('_page', query.pageIndex + 1)
      .set('_limit', query.pageSize)
      .set('_sort', query.order ? query.sort : 'id')
      .set('_order', query.order || 'asc');
    if (query.q.trim()) params = params.set('q', query.q.trim());
    if (query.role) params = params.set('role', query.role);
    if (query.status) params = params.set('status', query.status);

    return this.http.get<User[]>('/api/users', { params, observe: 'response' }).pipe(
      map((res) => ({
        items: res.body ?? [],
        total: Number(res.headers.get('X-Total-Count') ?? 0),
      })),
    );
  }

  update(id: number, changes: Partial<Pick<User, 'name' | 'role' | 'status' | 'department'>>) {
    return this.http.patch<User>(`/api/users/${id}`, changes);
  }

  delete(id: number) {
    return this.http.delete<void>(`/api/users/${id}`);
  }
}

@Injectable({ providedIn: 'root' })
export class SalesService {
  private readonly http = inject(HttpClient);

  sales(): Observable<SalesData> {
    return this.http.get<SalesData>('/api/sales');
  }

  stats(): Observable<Stats> {
    return this.http.get<Stats>('/api/stats');
  }
}
