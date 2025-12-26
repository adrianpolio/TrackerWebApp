import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { UserService } from '../../../services/user.service';
import { AuthService } from '../../../services/auth.service';
import { User, CreateUser, UpdateUser } from '../../../models/user.model';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './users.html',
  styleUrls: ['./users.scss']
})
export class UsersComponent implements OnInit {
  users: User[] = [];
  filteredUsers: User[] = [];
  loading: boolean = true;
  isAdmin: boolean = false;
  isSuperAdmin: boolean = false;

  showCreateModal: boolean = false;
  showEditModal: boolean = false;
  showDeleteModal: boolean = false;

  selectedUser: User | null = null;

  roles = [
    { value: 'User', label: 'Usuario' },
    { value: 'Admin', label: 'Administrador' },
    { value: 'SuperAdmin', label: 'Super Admin' }
  ];

  createForm: FormGroup;
  editForm: FormGroup;

  searchTerm: string = '';

  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 1;

  successMessage: string = '';
  errorMessage: string = '';
  refreshing: boolean = false;
  sortField: string = 'name';
  sortDirection: 'asc' | 'desc' = 'asc';
  jumpPage: number = 1;

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private fb: FormBuilder
  ) {
    this.createForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      role: ['User', [Validators.required]],
      isActive: [true]
    });

    this.editForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      role: ['User', [Validators.required]],
      isActive: [true]
    });
  }

  ngOnInit(): void {
    this.checkUserRole();
    this.loadUsers();
  }

  private checkUserRole(): void {
    const userData = this.authService.getUser();
    this.isAdmin = userData?.role === 'Admin';
    this.isSuperAdmin = userData?.role === 'SuperAdmin';

    if (!this.isAdmin && !this.isSuperAdmin) {
      window.location.href = '/';
    }
  }

  openCreateModal(): void {
    this.createForm.reset({
      name: '',
      email: '',
      password: '',
      role: 'User',
      isActive: true
    });
    this.showCreateModal = true;
    this.errorMessage = '';
    this.successMessage = '';
  }

  async loadUsers(): Promise<void> {
    try {
      this.loading = true;
      this.users = await this.userService.getAllUsers().toPromise() as User[] || [];
      this.filterUsers();
      this.calculatePagination();
      this.loading = false;
    } catch (error: any) {
      console.error('Error loading users:', error);
      this.errorMessage = error.error?.message || 'Error al cargar los usuarios';
      this.loading = false;
    }
  }

  filterUsers(): void {
    if (!this.searchTerm.trim()) {
      this.filteredUsers = [...this.users];
    } else {
      const term = this.searchTerm.toLowerCase().trim();
      this.filteredUsers = this.users.filter(user =>
        user.name.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term) ||
        user.role.toLowerCase().includes(term)
      );
    }
    this.sortUsers();
    this.currentPage = 1;
    this.calculatePagination();
  }

  calculatePagination(): void {
    this.totalPages = Math.ceil(this.filteredUsers.length / this.itemsPerPage);
    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = this.totalPages;
    }
  }

  get paginatedUsers(): User[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredUsers.slice(startIndex, endIndex);
  }

  openEditModal(user: User): void {
    this.selectedUser = user;
    
    this.editForm.patchValue({
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive
    });
    
    this.showEditModal = true;
    this.errorMessage = '';
    this.successMessage = '';
  }

  openDeleteModal(user: User): void {
    this.selectedUser = user;
    this.showDeleteModal = true;
    this.errorMessage = '';
    this.successMessage = '';
  }

  closeModal(): void {
    this.showCreateModal = false;
    this.showEditModal = false;
    this.showDeleteModal = false;
    this.selectedUser = null;
    this.errorMessage = '';
    this.successMessage = '';
  }

  async createUser(): Promise<void> {
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }

    try {
      const formValue = this.createForm.value;
      const newUser: CreateUser = {
        passwordHash: formValue.password,
        name: formValue.name,
        email: formValue.email,
        isActive: formValue.isActive,
        role: formValue.role
      };

      await this.userService.createUser(newUser).toPromise();

      this.successMessage = 'Usuario creado exitosamente';
      this.showCreateModal = false;

      setTimeout(() => {
        this.loadUsers();
        this.successMessage = '';
      }, 1500);

    } catch (error: any) {
      console.error('Error creating user:', error);
      this.errorMessage = error.error?.message || 'Error al crear el usuario';
    }
  }

  async updateUser(): Promise<void> {
    if (this.editForm.invalid || !this.selectedUser) {
      this.editForm.markAllAsTouched();
      return;
    }

    try {
      const formValue = this.editForm.value;
      
      const updatedUser: UpdateUser = {
        passwordHash: '', 
        name: formValue.name,
        email: formValue.email,
        isActive: formValue.isActive,
        role: formValue.role
      };

      const userId = Number(this.selectedUser.userId);
      await this.userService.updateUser(userId, updatedUser).toPromise();

      this.successMessage = 'Usuario actualizado exitosamente';
      this.showEditModal = false;
      this.selectedUser = null;

      setTimeout(() => {
        this.loadUsers();
        this.successMessage = '';
      }, 1500);

    } catch (error: any) {
      console.error('Error updating user:', error);
      
      if (error.status === 400 && error.error?.message?.includes('password')) {
        this.errorMessage = 'Error de validación. Contacta al administrador.';
      } else {
        this.errorMessage = error.error?.message || 'Error al actualizar el usuario';
      }
    }
  }

  async deleteUser(): Promise<void> {
    if (!this.selectedUser) return;

    try {
      const userId = Number(this.selectedUser.userId);
      await this.userService.deleteUser(userId).toPromise();

      this.successMessage = 'Usuario eliminado exitosamente';
      this.showDeleteModal = false;
      this.selectedUser = null;

      setTimeout(() => {
        this.loadUsers();
        this.successMessage = '';
      }, 1500);

    } catch (error: any) {
      console.error('Error deleting user:', error);
      this.errorMessage = error.error?.message || 'Error al eliminar el usuario';
    }
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  onPageSizeChange(): void {
    this.currentPage = 1;
    this.calculatePagination();
  }

  jumpToPage(): void {
    if (this.jumpPage >= 1 && this.jumpPage <= this.totalPages) {
      this.goToPage(this.jumpPage);
    } else {
      this.errorMessage = `Página inválida. Debe estar entre 1 y ${this.totalPages}`;
      setTimeout(() => {
        this.errorMessage = '';
      }, 3000);
    }
  }

  toggleSort(field: string): void {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }
    this.sortUsers();
  }

  sortUsers(): void {
    this.filteredUsers.sort((a: any, b: any) => {
      let aValue = a[this.sortField];
      let bValue = b[this.sortField];

      aValue = String(aValue || '').toLowerCase();
      bValue = String(bValue || '').toLowerCase();

      if (aValue < bValue) {
        return this.sortDirection === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return this.sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });

    this.currentPage = 1;
    this.calculatePagination();
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisiblePages = 5;

    if (this.totalPages <= maxVisiblePages) {
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      let startPage = Math.max(1, this.currentPage - 2);
      let endPage = Math.min(this.totalPages, this.currentPage + 2);

      if (startPage === 1) {
        endPage = maxVisiblePages;
      }
      if (endPage === this.totalPages) {
        startPage = this.totalPages - maxVisiblePages + 1;
      }

      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
    }

    return pages;
  }

  viewUserDetails(user: User): void {
    this.selectedUser = user;
    alert(`Detalles de ${user.name}\nEmail: ${user.email}\nRol: ${this.getRoleLabel(user.role)}\nEstado: ${user.isActive ? 'Activo' : 'Inactivo'}`);
  }

  getRoleLabel(role: string): string {
    const roleObj = this.roles.find(r => r.value === role);
    return roleObj ? roleObj.label : role;
  }

  get activeUsersCount(): number {
    return this.users.filter(u => u.isActive).length;
  }

  get inactiveUsersCount(): number {
    return this.users.filter(u => !u.isActive).length;
  }

  get userCount(): number {
    return this.users.filter(u => u.role === 'User').length;
  }

  get adminCount(): number {
    return this.users.filter(u => u.role === 'Admin').length;
  }

  get superAdminCount(): number {
    return this.users.filter(u => u.role === 'SuperAdmin').length;
  }

  get paginationRange(): string {
    const start = (this.currentPage - 1) * this.itemsPerPage + 1;
    const end = Math.min(this.currentPage * this.itemsPerPage, this.filteredUsers.length);
    return `${start} - ${end}`;
  }

  async onRefresh(): Promise<void> {
    this.refreshing = true;
    try {
      await this.loadUsers();
      this.successMessage = 'Lista actualizada correctamente';
      setTimeout(() => {
        this.successMessage = '';
      }, 3000);
    } catch (error) {
      console.error('Error refreshing:', error);
      this.errorMessage = 'Error al actualizar la lista';
    } finally {
      this.refreshing = false;
    }
  }

  exportToCSV(): void {
    const headers = ['ID', 'Nombre', 'Email', 'Rol', 'Estado'];
    const rows = this.filteredUsers.map(u => [
      u.userId,
      u.name,
      u.email,
      this.getRoleLabel(u.role),
      u.isActive ? 'Activo' : 'Inactivo'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `usuarios_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    this.successMessage = 'Archivo CSV exportado correctamente';
    setTimeout(() => {
      this.successMessage = '';
    }, 3000);
  }

  toggleUserStatus(user: User): void {
    const confirmMessage = `¿Estás seguro de ${user.isActive ? 'desactivar' : 'activar'} al usuario ${user.name}?`;

    if (confirm(confirmMessage)) {
      const updatedUser: UpdateUser = {
        passwordHash: '', // String vacío para mantener la contraseña actual
        name: user.name,
        email: user.email,
        isActive: !user.isActive,
        role: user.role
      };

      const userId = Number(user.userId);
      this.userService.updateUser(userId, updatedUser).toPromise()
        .then(() => {
          this.successMessage = `Usuario ${!user.isActive ? 'activado' : 'desactivado'} exitosamente`;
          this.loadUsers();
          setTimeout(() => {
            this.successMessage = '';
          }, 3000);
        })
        .catch(error => {
          console.error('Error toggling user status:', error);
          this.errorMessage = 'Error al cambiar el estado del usuario';
        });
    }
  }
}