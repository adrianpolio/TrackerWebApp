import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ShipmentService } from '../../../services/shipment.service';
import { AuthService } from '../../../services/auth.service';
import { UserService } from '../../../services/user.service';
import { CustomerService } from '../../../services/customer.service';
import { Shipment, CreateShipment, UpdateShipment } from '../../../models/shipment.model';
import { User } from '../../../models/user.model';
import { Customer } from '../../../models/customer.model';

@Component({
  selector: 'app-shipments',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './shipments.html',
  styleUrls: ['./shipments.scss']
})
export class ShipmentsComponent implements OnInit {
  shipments: Shipment[] = [];
  filteredShipments: Shipment[] = [];
  users: User[] = [];
  customers: Customer[] = [];
  loading: boolean = true;
  isAdmin: boolean = false;

  showCreateModal: boolean = false;
  showEditModal: boolean = false;
  showDetailsModal: boolean = false;
  showDeleteModal: boolean = false;
  showStatusModal: boolean = false;

  selectedShipment: Shipment | null = null;
  currentUser: User | null = null;

  shipmentStatuses = [
    { value: 'Habilitado', label: 'Habilitado' },
    { value: 'Empaquetado', label: 'Empaquetado' },
    { value: 'En Tránsito', label: 'En Tránsito' },
    { value: 'LlegadaDestino', label: 'Llegada a Destino' },
    { value: 'Entregado', label: 'Entregado' },
    { value: 'Devuelto', label: 'Devuelto' }
  ];

  createForm: FormGroup;
  editForm: FormGroup;
  statusForm: FormGroup;

  searchTerm: string = '';
  statusFilter: string = 'ALL';

  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 1;

  successMessage: string = '';
  errorMessage: string = '';
  refreshing: boolean = false;
  sortField: string = 'shippedAt';
  sortDirection: 'asc' | 'desc' = 'desc';
  jumpPage: number = 1;

  totalShipments: number = 0;
  activeCount: number = 0;
  deliveredCount: number = 0;
  cancelledCount: number = 0;

  constructor(
    private shipmentService: ShipmentService,
    private authService: AuthService,
    private userService: UserService,
    private customerService: CustomerService,
    private fb: FormBuilder
  ) {
    this.createForm = this.fb.group({
      customerId: ['', [Validators.required]],
      userId: ['', [Validators.required]],
      trackingNumber: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required]],
      destination: ['', [Validators.required]]
    });

    this.editForm = this.fb.group({
      shipmentId: ['', [Validators.required]],
      trackingNumber: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required]],
      destination: ['', [Validators.required]]
    });

    this.statusForm = this.fb.group({
      shipmentStatus: ['', [Validators.required]],
      receivedBy: [''],
      receivedAt: ['']
    });
  }

  ngOnInit(): void {
    this.checkUserRole();
    this.loadCurrentUser();
    this.loadShipments();
    this.loadUsers();
    this.loadCustomers();
  }

  private checkUserRole(): void {
    const userData = this.authService.getUser();
    this.isAdmin = userData?.role === 'Admin' || userData?.role === 'SuperAdmin';

    if (!this.isAdmin && !userData) {
      window.location.href = '/';
    }
  }

  private loadCurrentUser(): void {
    this.currentUser = this.authService.getUser();
  }

  async loadShipments(): Promise<void> {
    try {
      this.loading = true;
      this.shipments = await this.shipmentService.getAllShipments().toPromise() || [];
      this.calculateStatistics();
      this.filterShipments();
      this.calculatePagination();
      this.loading = false;
    } catch (error: any) {
      console.error('Error loading shipments:', error);
      this.errorMessage = error.error?.message || 'Error al cargar los envíos';
      this.loading = false;
    }
  }

  async loadUsers(): Promise<void> {
    try {
      this.users = await this.userService.getAllUsers().toPromise() || [];
    } catch (error: any) {
      console.error('Error loading users:', error);
    }
  }

  async loadCustomers(): Promise<void> {
  try {
    this.customers = await this.customerService.getAllCustomers().toPromise() || [];
    
    if (this.customers.length === 0) {
      console.warn('No hay clientes en la base de datos, usando datos de ejemplo');
      this.customers = [
        {
          customerId: 1,
          name: 'Empresa Andes SAC 20045',
          docmNumber: '20123456789',
          email: 'empresa@andes.com',
          phone: '999888777',
          customerTypeId: 1,
          customerTypeDescription: 'Empresa'
        },
        {
          customerId: 2,
          name: 'Joseph Rojas Ruiz',
          docmNumber: '76543210',
          email: 'joseph@test.com',
          phone: '987654321',
          customerTypeId: 2,
          customerTypeDescription: 'Persona Natural'
        }
      ];
    }
    
    console.log('Clientes cargados:', this.customers);
    
  } catch (error: any) {
    console.error('Error loading customers:', error);
    this.customers = [
      {
        customerId: 1,
        name: 'Cliente de Ejemplo 1',
        docmNumber: '12345678',
        email: 'cliente1@example.com',
        phone: '999888777',
        customerTypeId: 1,
        customerTypeDescription: 'Regular'
      },
      {
        customerId: 2,
        name: 'Cliente de Ejemplo 2',
        docmNumber: '87654321',
        email: 'cliente2@example.com',
        phone: '987654321',
        customerTypeId: 2,
        customerTypeDescription: 'VIP'
      }
    ];
    this.errorMessage = 'No se pudieron cargar los clientes. Usando datos de ejemplo.';
  }
}
  calculateStatistics(): void {
    this.totalShipments = this.shipments.length;
    this.activeCount = this.shipments.filter(s =>
      s.shipmentStatusDescription === 'Habilitado' || s.shipmentStatus === 'Habilitado'
    ).length;
    this.deliveredCount = this.shipments.filter(s =>
      s.shipmentStatusDescription === 'Entregado' || s.shipmentStatus === 'Entregado'
    ).length;
    this.cancelledCount = this.shipments.filter(s =>
      s.shipmentStatusDescription === 'Devuelto' || s.shipmentStatus === 'Devuelto'
    ).length;
  }

  filterShipments(): void {
    let filtered = [...this.shipments];

    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(shipment =>
        shipment.trackingNumber.toLowerCase().includes(term) ||
        shipment.description.toLowerCase().includes(term) ||
        shipment.destination.toLowerCase().includes(term) ||
        shipment.customerName.toLowerCase().includes(term) ||
        shipment.userName.toLowerCase().includes(term)
      );
    }

    if (this.statusFilter !== 'ALL') {
      filtered = filtered.filter(shipment =>
        (shipment.shipmentStatusDescription || shipment.shipmentStatus) === this.statusFilter
      );
    }

    this.filteredShipments = filtered;
    this.sortShipments();
    this.currentPage = 1;
    this.calculatePagination();
  }

  sortShipments(): void {
    this.filteredShipments.sort((a: any, b: any) => {
      let aValue = a[this.sortField];
      let bValue = b[this.sortField];

      if (this.sortField.includes('At') || this.sortField === 'shippedAt' || this.sortField === 'receivedAt') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }

      if (aValue < bValue) {
        return this.sortDirection === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return this.sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }

  calculatePagination(): void {
    this.totalPages = Math.ceil(this.filteredShipments.length / this.itemsPerPage);
    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = this.totalPages;
    }
  }

  get paginatedShipments(): Shipment[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredShipments.slice(startIndex, endIndex);
  }

openCreateModal(): void {
  const trackingNumber = 'TRK-' + Math.floor(1000 + Math.random() * 9000);
  const defaultCustomer = this.customers.length > 0 ? this.customers[0].customerId : null;
  const defaultUser = this.currentUser?.userId || 
                     (this.users.length > 0 ? this.users[0].userId : null);

  if (!defaultCustomer) {
    this.errorMessage = 'No hay clientes disponibles. Debe crear clientes primero.';
    return;
  }

  if (!defaultUser) {
    this.errorMessage = 'No hay usuarios disponibles.';
    return;
  }

  this.createForm.reset({
    customerId: defaultCustomer,
    userId: defaultUser,
    trackingNumber: trackingNumber,
    description: '',
    destination: ''
  });

  this.showCreateModal = true;
  this.errorMessage = '';
  this.successMessage = '';
}
  openEditModal(shipment: Shipment): void {
    this.selectedShipment = shipment;

    this.editForm.patchValue({
      shipmentId: shipment.shipmentId,
      trackingNumber: shipment.trackingNumber,
      description: shipment.description,
      destination: shipment.destination
    });

    this.showEditModal = true;
    this.errorMessage = '';
    this.successMessage = '';
  }

  openStatusModal(shipment: Shipment): void {
    this.selectedShipment = shipment;

    this.statusForm.reset({
      shipmentStatus: shipment.shipmentStatusDescription || shipment.shipmentStatus || 'Habilitado',
      receivedBy: shipment.receivedBy || '',
      receivedAt: shipment.receivedAt ? this.formatDate(new Date(shipment.receivedAt)) : ''
    });

    this.showStatusModal = true;
    this.errorMessage = '';
    this.successMessage = '';
  }

  openDetailsModal(shipment: Shipment): void {
    this.selectedShipment = shipment;
    this.showDetailsModal = true;
  }

  openDeleteModal(shipment: Shipment): void {
    this.selectedShipment = shipment;
    this.showDeleteModal = true;
    this.errorMessage = '';
    this.successMessage = '';
  }

  closeModal(): void {
    this.showCreateModal = false;
    this.showEditModal = false;
    this.showDetailsModal = false;
    this.showDeleteModal = false;
    this.showStatusModal = false;
    this.selectedShipment = null;
    this.errorMessage = '';
    this.successMessage = '';
  }

  async createShipment(): Promise<void> {
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }

    try {
      const formValue = this.createForm.value;

      const newShipment: CreateShipment = {
        customerId: Number(formValue.customerId),
        userId: Number(formValue.userId),
        trackingNumber: formValue.trackingNumber,
        description: formValue.description,
        destination: formValue.destination
      };

      console.log('Creando envío:', newShipment);

      await this.shipmentService.createShipment(newShipment).toPromise();

      this.successMessage = 'Envío creado exitosamente';
      this.showCreateModal = false;

      setTimeout(() => {
        this.loadShipments();
        this.successMessage = '';
      }, 1500);

    } catch (error: any) {
      console.error('Error creating shipment:', error);
      this.errorMessage = error.error?.message || 'Error al crear el envío';
    }
  }

  async updateShipment(): Promise<void> {
    if (this.editForm.invalid || !this.selectedShipment) {
      this.editForm.markAllAsTouched();
      return;
    }

    try {
      const formValue = this.editForm.value;

      const updatedShipment: UpdateShipment = {
        shipmentId: Number(formValue.shipmentId),
        trackingNumber: formValue.trackingNumber,
        description: formValue.description,
        destination: formValue.destination
      };

      console.log('Actualizando envío:', updatedShipment);

      await this.shipmentService.updateShipment(this.selectedShipment.shipmentId, updatedShipment).toPromise();

      this.successMessage = 'Envío actualizado exitosamente';
      this.showEditModal = false;
      this.selectedShipment = null;

      setTimeout(() => {
        this.loadShipments();
        this.successMessage = '';
      }, 1500);

    } catch (error: any) {
      console.error('Error updating shipment:', error);
      this.errorMessage = error.error?.message || 'Error al actualizar el envío';
    }
  }

  async updateShipmentStatus(){
  // Codigo Para cambiar de estado del envio
  }

  async deleteShipment(): Promise<void> {
    if (!this.selectedShipment) return;

    try {
      await this.shipmentService.deleteShipment(this.selectedShipment.shipmentId).toPromise();

      this.successMessage = 'Envío eliminado exitosamente';
      this.showDeleteModal = false;
      this.selectedShipment = null;

      setTimeout(() => {
        this.loadShipments();
        this.successMessage = '';
      }, 1500);

    } catch (error: any) {
      console.error('Error deleting shipment:', error);
      this.errorMessage = error.error?.message || 'Error al eliminar el envío';
    }
  }

  formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  formatDateTime(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
  }

  getUserName(userId: number): string {
    const user = this.users.find(u => u.userId === userId.toString());
    return user ? user.name : `Usuario ${userId}`;
  }

  getCustomerName(customerId: number): string {
    const customer = this.customers.find(c => c.customerId === customerId);
    return customer ? customer.name : `Cliente ${customerId}`;
  }

  getStatusLabel(status: string): string {
    return status || 'Habilitado';
  }

  getStatusClass(status: string): string {
    const statusLower = (status || '').toLowerCase();

    if (statusLower.includes('entregado')) return 'status-delivered';
    if (statusLower.includes('habilitado')) return 'status-active';
    if (statusLower.includes('empaquetado')) return 'status-processing';
    if (statusLower.includes('tránsito') || statusLower.includes('transito')) return 'status-transit';
    if (statusLower.includes('llegada')) return 'status-arrived';
    if (statusLower.includes('devuelto')) return 'status-returned';

    return 'status-active';
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
      this.sortDirection = 'desc';
    }
    this.sortShipments();
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

  get paginationRange(): string {
    const start = (this.currentPage - 1) * this.itemsPerPage + 1;
    const end = Math.min(this.currentPage * this.itemsPerPage, this.filteredShipments.length);
    return `${start} - ${end}`;
  }

  async onRefresh(): Promise<void> {
    this.refreshing = true;
    try {
      await this.loadShipments();
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
    const headers = ['ID', 'N° Seguimiento', 'Descripción', 'Destino', 'Estado', 'Cliente', 'Usuario', 'Fecha Envío', 'Fecha Recepción'];
    const rows = this.filteredShipments.map(s => [
      s.shipmentId,
      s.trackingNumber,
      s.description,
      s.destination,
      s.shipmentStatusDescription || s.shipmentStatus,
      s.customerName,
      s.userName,
      new Date(s.shippedAt).toLocaleString(),
      s.receivedAt ? new Date(s.receivedAt).toLocaleString() : 'Pendiente'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `envios_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    this.successMessage = 'Archivo CSV exportado correctamente';
    setTimeout(() => {
      this.successMessage = '';
    }, 3000);
  }

  printShippingLabel(shipment: Shipment): void {
    const printContent = `
      <div style="font-family: Arial, sans-serif; padding: 20px; border: 2px dashed #ccc;">
        <h2 style="text-align: center;">ETIQUETA DE ENVÍO</h2>
        <hr>
        <div style="text-align: center; margin: 20px 0;">
          <h1 style="font-size: 24px; letter-spacing: 2px;">${shipment.trackingNumber}</h1>
          <p>Número de Seguimiento</p>
        </div>
        <hr>
        <div style="margin-top: 20px;">
          <p><strong>Descripción:</strong> ${shipment.description}</p>
          <p><strong>Destino:</strong> ${shipment.destination}</p>
          <p><strong>Cliente:</strong> ${shipment.customerName}</p>
          <p><strong>Usuario:</strong> ${shipment.userName}</p>
          <p><strong>Fecha de envío:</strong> ${new Date(shipment.shippedAt).toLocaleString()}</p>
          <p><strong>Estado:</strong> ${shipment.shipmentStatusDescription || shipment.shipmentStatus}</p>
        </div>
        ${shipment.receivedAt ? `
          <hr>
          <div style="margin-top: 20px;">
            <p><strong>Recibido por:</strong> ${shipment.receivedBy || 'No especificado'}</p>
            <p><strong>Fecha de recepción:</strong> ${new Date(shipment.receivedAt).toLocaleString()}</p>
          </div>
        ` : ''}
        <div style="margin-top: 30px; text-align: center; font-size: 12px;">
          <p>Generado el: ${new Date().toLocaleString()}</p>
        </div>
      </div>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Etiqueta de Envío - ${shipment.trackingNumber}</title>
            <style>
              @media print {
                body { margin: 0; padding: 0; }
                @page { margin: 0; }
              }
            </style>
          </head>
          <body onload="window.print(); window.close();">
            ${printContent}
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  }
}