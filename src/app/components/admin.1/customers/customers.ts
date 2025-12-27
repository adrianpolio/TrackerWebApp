import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CustomerService } from '../../../services/customer.service';
import { AuthService } from '../../../services/auth.service';
import { Customer, CreateCustomer, UpdateCustomer } from '../../../models/customer.model';

@Component({
  selector: 'app-customers',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './customers.html',
  styleUrls: ['../customers/customers.scss']
})
export class CustomersComponent implements OnInit {
  customers: Customer[] = [];
  filteredCustomers: Customer[] = [];
  loading: boolean = true;
  isAdmin: boolean = false;
  isSuperAdmin: boolean = false;

  showCreateModal: boolean = false;
  showEditModal: boolean = false;
  showDeleteModal: boolean = false;
  refreshing: boolean = false;
  sortField: string = 'customerId';
  sortDirection: 'asc' | 'desc' = 'asc';
  jumpPage: number = 1;

  selectedCustomer: Customer | null = null;

  customerTypes = [
    { id: 1, description: 'Regular' },
    { id: 2, description: 'VIP' },
    { id: 3, description: 'Gold' },
    { id: 4, description: 'Platinium' }
  ];

  createForm: FormGroup;
  editForm: FormGroup;

  searchTerm: string = '';

  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 1;

  successMessage: string = '';
  errorMessage: string = '';

  constructor(
    private customerService: CustomerService,
    private authService: AuthService,
    private fb: FormBuilder
  ) {
    this.createForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      docmNumber: ['', [Validators.required, Validators.pattern('^[0-9]{8,12}$')]],
      email: ['', [Validators.required, Validators.email]],
      //phone: ['', [Validators.required, Validators.pattern('^[0-9]{9,15}$')]],
      phone: ['', [Validators.required, Validators.minLength(9)]],
      customerTypeId: [1, [Validators.required, Validators.min(1)]]
    });

    this.editForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      docmNumber: ['', [Validators.required, Validators.pattern('^[0-9]{8,12}$')]],
      email: ['', [Validators.required, Validators.email]],
      //phone: ['', [Validators.required, Validators.pattern('^[0-9]{9,15}$')]],
      phone: ['', [Validators.required, Validators.minLength(9)]],
      customerTypeId: [1, [Validators.required, Validators.min(1)]]
    });
  }

  ngOnInit(): void {
    this.checkUserRole();
    this.loadCustomers();
  }

  private checkUserRole(): void {
    const userData = this.authService.getUser();
    this.isAdmin = userData?.role === 'ADMIN' || userData?.role === 'Admin';
    this.isSuperAdmin = userData?.role === 'SUPER_ADMIN' || userData?.role === 'SuperAdmin';

    if (!this.isAdmin && !this.isSuperAdmin) {
      window.location.href = '/';
    }
  }

  async loadCustomers(): Promise<void> {
    try {
      this.loading = true;
      this.customers = await this.customerService.getAllCustomers().toPromise() as Customer[] || [];
      this.filterCustomers();
      this.calculatePagination();
      this.loading = false;
    } catch (error: any) {
      console.error('Error loading customers:', error);
      this.errorMessage = error.error?.message || 'Error al cargar los clientes';
      this.loading = false;
    }
  }

  calculatePagination(): void {
    this.totalPages = Math.ceil(this.filteredCustomers.length / this.itemsPerPage);
    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = this.totalPages;
    }
  }

  get paginatedCustomers(): Customer[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredCustomers.slice(startIndex, endIndex);
  }

  openCreateModal(): void {
    this.createForm.reset({
      name: '',
      docmNumber: '',
      email: '',
      phone: '',
      customerTypeId: 1
    });
    this.showCreateModal = true;
    this.errorMessage = '';
    this.successMessage = '';
  }

  openEditModal(customer: Customer): void {
    this.selectedCustomer = customer;
    this.editForm.patchValue({
      name: customer.name,
      docmNumber: customer.docmNumber,
      email: customer.email,
      phone: customer.phone,
      customerTypeId: customer.customerTypeId
    });
    this.showEditModal = true;
    this.errorMessage = '';
    this.successMessage = '';
  }

  openDeleteModal(customer: Customer): void {
    this.selectedCustomer = customer;
    this.showDeleteModal = true;
    this.errorMessage = '';
    this.successMessage = '';
  }

  closeModal(): void {
    this.showCreateModal = false;
    this.showEditModal = false;
    this.showDeleteModal = false;
    this.selectedCustomer = null;
    this.errorMessage = '';
    this.successMessage = '';
  }

  async createCustomer(): Promise<void> {
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }

    try {
      const newCustomer: CreateCustomer = this.createForm.value;
      const createdCustomer = await this.customerService.createCustomer(newCustomer).toPromise();

      this.successMessage = 'Cliente creado exitosamente';
      this.showCreateModal = false;

      setTimeout(() => {
        this.loadCustomers();
        this.successMessage = '';
      }, 1500);

    } catch (error: any) {
      console.error('Error creating customer:', error);
      this.errorMessage = error.error?.message || 'Error al crear el cliente';
    }
  }

  async updateCustomer(): Promise<void> {
    if (this.editForm.invalid || !this.selectedCustomer) {
      this.editForm.markAllAsTouched();
      return;
    }

    try {
      const updatedCustomer: UpdateCustomer = this.editForm.value;
      await this.customerService.updateCustomer(this.selectedCustomer.customerId, updatedCustomer).toPromise();

      this.successMessage = 'Cliente actualizado exitosamente';
      this.showEditModal = false;
      this.selectedCustomer = null;

      setTimeout(() => {
        this.loadCustomers();
        this.successMessage = '';
      }, 1500);

    } catch (error: any) {
      console.error('Error updating customer:', error);
      this.errorMessage = error.error?.message || 'Error al actualizar el cliente';
    }
  }

  async deleteCustomer(): Promise<void> {
    if (!this.selectedCustomer) return;

    try {
      await this.customerService.deleteCustomer(this.selectedCustomer.customerId).toPromise();

      this.successMessage = 'Cliente eliminado exitosamente';
      this.showDeleteModal = false;
      this.selectedCustomer = null;

      setTimeout(() => {
        this.loadCustomers();
        this.successMessage = '';
      }, 1500);

    } catch (error: any) {
      console.error('Error deleting customer:', error);
      this.errorMessage = error.error?.message || 'Error al eliminar el cliente';
    }
  }

  goToPage(page: number | string): void {
    const pageNumber = typeof page === 'string' ? parseInt(page, 10) : page;

    if (!isNaN(pageNumber) && pageNumber >= 1 && pageNumber <= this.totalPages) {
      this.currentPage = pageNumber;
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

  getCustomerTypeDescription(typeId: number): string {
    const type = this.customerTypes.find(t => t.id === typeId);
    return type?.description || 'Desconocido';
  }
  get regularCustomersCount(): number {
    return this.customers.filter(c => c.customerTypeId === 1).length;
  }

  get vipCustomersCount(): number {
    return this.customers.filter(c => c.customerTypeId === 2).length;
  }

  get goldCustomersCount(): number {
    return this.customers.filter(c => c.customerTypeId === 3).length;
  }
  get platiniumCustomersCount(): number {
    return this.customers.filter(c => c.customerTypeId === 4).length;
  }

  truncateText(text: string, length: number = 20): string {
    if (!text) return '';
    if (text.length <= length) return text;
    return text.substring(0, length) + '...';
  }

  get paginationRange(): string {
    const start = (this.currentPage - 1) * this.itemsPerPage + 1;
    const end = Math.min(this.currentPage * this.itemsPerPage, this.filteredCustomers.length);
    return `${start} - ${end}`;
  }
  async onRefresh(): Promise<void> {
    this.refreshing = true;
    try {
      await this.loadCustomers();
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
  onPageSizeChange(): void {
    this.currentPage = 1;
    this.calculatePagination();
  }

  jumpToPage(): void {
    const page = Number(this.jumpPage);
    if (page >= 1 && page <= this.totalPages) {
      this.goToPage(page);
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
    this.sortCustomers();
  }

  sortCustomers(): void {
    this.filteredCustomers.sort((a: any, b: any) => {
      const aValue = a[this.sortField];
      const bValue = b[this.sortField];

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

  getPageNumbers(): (number | string)[] {
    const pages: (number | string)[] = [];
    const delta = 2;
    const left = this.currentPage - delta;
    const right = this.currentPage + delta;

    for (let i = 1; i <= this.totalPages; i++) {
      if (i === 1 || i === this.totalPages || (i >= left && i <= right)) {
        pages.push(i);
      } else if (i === left - 1 || i === right + 1) {
        pages.push('...');
      }
    }

    return pages;
  }

  viewCustomerDetails(customer: Customer): void {
    console.log('Ver detalles:', customer);
    this.selectedCustomer = customer;
    alert(`Detalles de ${customer.name}\nEmail: ${customer.email}\nTeléfono: ${customer.phone}\nDocumento: ${customer.docmNumber}`);
  }

  exportToCSV(): void {
    const headers = ['ID', 'Nombre', 'Documento', 'Email', 'Teléfono', 'Tipo Cliente'];
    const rows = this.filteredCustomers.map(c => [
      c.customerId,
      c.name,
      c.docmNumber,
      c.email,
      c.phone,
      c.customerTypeDescription || this.getCustomerTypeDescription(c.customerTypeId)
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `clientes_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    this.successMessage = 'Archivo CSV exportado correctamente';
    setTimeout(() => {
      this.successMessage = '';
    }, 3000);
  }

  filterCustomers(): void {
    if (!this.searchTerm.trim()) {
      this.filteredCustomers = [...this.customers];
    } else {
      const term = this.searchTerm.toLowerCase().trim();
      this.filteredCustomers = this.customers.filter(customer =>
        customer.name.toLowerCase().includes(term) ||
        customer.email.toLowerCase().includes(term) ||
        customer.phone.includes(term) ||
        customer.docmNumber.includes(term) ||
        customer.customerTypeDescription?.toLowerCase().includes(term)
      );
    }

    this.sortCustomers();
    this.currentPage = 1;
    this.calculatePagination();
  }
}
