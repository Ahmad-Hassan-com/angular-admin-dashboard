import { DatePipe } from '@angular/common';
import { AfterViewInit, Component, DestroyRef, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { catchError, debounceTime, distinctUntilChanged, filter, map, merge, of, startWith, Subject, switchMap, tap } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { Role, User, UserQuery, UserStatus } from '../../core/models';
import { UserService } from '../../core/services/data.service';
import { ConfirmDialog, ConfirmDialogData } from './confirm-dialog';
import { UserEditDialog } from './user-edit-dialog';

@Component({
  selector: 'app-users',
  imports: [
    ReactiveFormsModule,
    DatePipe,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatTooltipModule,
    MatProgressBarModule,
  ],
  templateUrl: './users.html',
  styleUrl: './users.scss',
})
export default class Users implements AfterViewInit {
  private readonly userService = inject(UserService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly auth = inject(AuthService);

  protected readonly columns = ['name', 'role', 'status', 'department', 'createdAt', 'lastLogin', 'actions'];
  protected readonly statusIcon: Record<string, string> = {
    active: 'check_circle',
    pending: 'schedule',
    suspended: 'block',
  };
  protected readonly statusClass: Record<string, string> = {
    active: 'good',
    pending: 'warning',
    suspended: 'critical',
  };

  protected readonly rows = signal<User[]>([]);
  protected readonly total = signal(0);
  protected readonly loading = signal(true);

  protected readonly filters = inject(NonNullableFormBuilder).group({
    q: '',
    role: '' as Role | '',
    status: '' as UserStatus | '',
  });

  private readonly sort = viewChild.required(MatSort);
  private readonly paginator = viewChild.required(MatPaginator);
  private readonly reload$ = new Subject<void>();

  ngAfterViewInit(): void {
    const sort = this.sort();
    const paginator = this.paginator();

    const filterChange$ = this.filters.valueChanges.pipe(
      debounceTime(300),
      map(() => JSON.stringify(this.filters.getRawValue())),
      distinctUntilChanged(),
      tap(() => (paginator.pageIndex = 0)),
    );
    sort.sortChange.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => (paginator.pageIndex = 0));

    // Any change (sort, page, filter, explicit reload) cancels the in-flight request and fetches again.
    merge(sort.sortChange, paginator.page, filterChange$, this.reload$)
      .pipe(
        startWith(null),
        tap(() => this.loading.set(true)),
        switchMap(() => {
          const { q, role, status } = this.filters.getRawValue();
          const query: UserQuery = {
            q,
            role,
            status,
            sort: sort.active as keyof User,
            order: sort.direction,
            pageIndex: paginator.pageIndex,
            pageSize: paginator.pageSize,
          };
          return this.userService.list(query).pipe(catchError(() => of({ items: [], total: 0 })));
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(({ items, total }) => {
        this.rows.set(items);
        this.total.set(total);
        this.loading.set(false);
      });
  }

  protected clearFilters(): void {
    this.filters.reset();
  }

  protected edit(user: User): void {
    this.dialog
      .open(UserEditDialog, { data: user, width: '480px', maxWidth: '95vw' })
      .afterClosed()
      .pipe(
        filter((changes): changes is Partial<User> => !!changes),
        switchMap((changes) => this.userService.update(user.id, changes)),
      )
      .subscribe((updated) => {
        this.snackBar.open(`Updated ${updated.name}`, undefined, { duration: 2500 });
        this.reload$.next();
      });
  }

  protected toggleSuspended(user: User): void {
    const status: UserStatus = user.status === 'suspended' ? 'active' : 'suspended';
    this.userService.update(user.id, { status }).subscribe((updated) => {
      this.snackBar.open(`${updated.name} is now ${status}`, undefined, { duration: 2500 });
      this.reload$.next();
    });
  }

  protected remove(user: User): void {
    this.dialog
      .open<ConfirmDialog, ConfirmDialogData, boolean>(ConfirmDialog, {
        data: {
          title: 'Delete user?',
          message: `${user.name} (${user.email}) will be permanently removed.`,
          confirmText: 'Delete',
        },
      })
      .afterClosed()
      .pipe(
        filter(Boolean),
        switchMap(() => this.userService.delete(user.id)),
      )
      .subscribe(() => {
        this.snackBar.open(`Deleted ${user.name}`, undefined, { duration: 2500 });
        this.reload$.next();
      });
  }
}
