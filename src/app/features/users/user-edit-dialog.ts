import { Component, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { AuthService } from '../../core/auth/auth.service';
import { Role, User, UserStatus } from '../../core/models';

@Component({
  selector: 'app-user-edit-dialog',
  imports: [ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>Edit user</h2>
    <form [formGroup]="form" (ngSubmit)="save()">
      <mat-dialog-content class="fields">
        <p class="muted">{{ user.email }}</p>
        <mat-form-field appearance="outline">
          <mat-label>Name</mat-label>
          <input matInput formControlName="name" />
          <mat-error>Name is required</mat-error>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Department</mat-label>
          <mat-select formControlName="department">
            @for (d of departments; track d) {
              <mat-option [value]="d">{{ d }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Role</mat-label>
          <mat-select formControlName="role">
            <mat-option value="user">User</mat-option>
            <mat-option value="admin">Admin</mat-option>
          </mat-select>
          @if (isSelf) {
            <mat-hint>You can't change your own role</mat-hint>
          }
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Status</mat-label>
          <mat-select formControlName="status">
            <mat-option value="active">Active</mat-option>
            <mat-option value="pending">Pending</mat-option>
            <mat-option value="suspended">Suspended</mat-option>
          </mat-select>
        </mat-form-field>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" mat-dialog-close>Cancel</button>
        <button mat-flat-button type="submit" [disabled]="form.invalid || form.pristine">Save</button>
      </mat-dialog-actions>
    </form>
  `,
  styles: `
    .fields {
      display: flex;
      flex-direction: column;
    }
  `,
})
export class UserEditDialog {
  protected readonly user = inject<User>(MAT_DIALOG_DATA);
  private readonly ref = inject(MatDialogRef<UserEditDialog, Partial<User>>);
  protected readonly isSelf = inject(AuthService).claims()?.sub === this.user.id;

  protected readonly departments = ['Sales', 'Marketing', 'Engineering', 'Support', 'Finance', 'Operations', 'Unassigned'];

  protected readonly form = inject(NonNullableFormBuilder).group({
    name: [this.user.name, Validators.required],
    department: [this.user.department],
    role: [{ value: this.user.role as Role, disabled: this.isSelf }],
    status: [{ value: this.user.status as UserStatus, disabled: this.isSelf }],
  });

  protected save(): void {
    // form.value omits disabled controls, so admins never send changes to their own role/status.
    this.ref.close(this.form.value);
  }
}
