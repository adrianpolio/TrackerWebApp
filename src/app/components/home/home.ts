import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ShipmentService } from '../../services/shipment.service';
import { AuthService } from '../../services/auth.service';
import { Shipment } from '../../models/shipment.model';
import { UserService } from '../../services/user.service'; 
import { CustomerService } from '../../services/customer.service';
import { User } from '../../models/user.model'; 
import { Customer } from '../../models/customer.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './home.html',
  styleUrls: ['./home.scss']
})
export class Home implements OnInit {
  userData: any = null;
  shipments: Shipment[] = [];
  users: User[] = []; 
  customers: Customer[] = []; 
  loading: boolean = true;
  refreshing: boolean = false;
  searchQuery: string = '';
  filter: string = 'all'; 
  
  showUserMenu = false;
  userInitial: string = 'U';

  isAdmin: boolean = false;
  isSuperAdmin: boolean = false;

   adminStats = {
    totalUsers: 0,
    totalCustomers: 0,
    totalShipments: 0,
    shipmentsToday: 0,
    shipmentsThisWeek: 0
  };

  stats = {
    total: 0,
    habilitado: 0,
    empaquetado: 0,
    transito: 0,
    destino: 0,
    entregado: 0,
    devuelto: 0
  };

  statuses = [
    { code: '1', name: 'Habilitado', color: 'warning', icon: 'fa-play-circle' },
    { code: '2', name: 'Empaquetado', color: 'info', icon: 'fa-box' },
    { code: '3', name: 'En Tránsito', color: 'primary', icon: 'fa-truck' },
    { code: '4', name: 'Llegó a Destino', color: 'info', icon: 'fa-map-marker-alt' },
    { code: '5', name: 'Entregado', color: 'success', icon: 'fa-check-circle' },
    { code: '6', name: 'Devuelto', color: 'danger', icon: 'fa-undo' }
  ];

  constructor(
    private shipmentService: ShipmentService,
    private authService: AuthService,
    private userService: UserService, 
    private customerService: CustomerService, 
    private router: Router
  ) { }

   ngOnInit(): void {
    this.loadUserData();
    document.addEventListener('click', this.handleClickOutside.bind(this));
  }

  async loadUserData(): Promise<void> {
    try {
      this.userData = this.authService.getUser();

      if (!this.userData) {
        this.router.navigate(['/login']);
        return;
      }

      this.isAdmin = this.userData.role === 'ADMIN' || this.userData.role === 'Admin';
      this.isSuperAdmin = this.userData.role === 'SUPER_ADMIN' || this.userData.role === 'SuperAdmin';
      
      this.userInitial = this.getUserInitial();
      
      if (this.isAdmin || this.isSuperAdmin) {
        await Promise.all([
          this.loadAllShipments(),
          this.loadAllUsers(),
          this.loadAllCustomers()
        ]);
        this.calculateAdminStats();
      } else {
        await this.loadUserShipments();
      }

      this.loading = false;
      this.refreshing = false;
    } catch (error) {
      console.error('Error loading user data:', error);
      this.loading = false;
      this.refreshing = false;
    }
  }

  async loadAllShipments(): Promise<void> {
    try {
      this.shipments = await this.shipmentService.getAllShipments().toPromise() as Shipment[] || [];
    } catch (error) {
      console.error('Error loading all shipments:', error);
      this.shipments = [];
    }
  }

  async loadAllUsers(): Promise<void> {
    try {
      this.users = await this.userService.getAllUsers().toPromise() as User[] || [];
    } catch (error) {
      console.error('Error loading users:', error);
      this.users = [];
    }
  }

  async loadAllCustomers(): Promise<void> {
    try {
      this.customers = await this.customerService.getAllCustomers().toPromise() as Customer[] || [];
    } catch (error) {
      console.error('Error loading customers:', error);
      this.customers = [];
    }
  }

 async loadUserShipments(): Promise<void> {
    try {
      const allShipments = await this.shipmentService.getAllShipments().toPromise() as Shipment[];
      
      if (!allShipments) {
        this.shipments = [];
      } else {
        const currentUserId = this.userData?.userId || this.userData?.id;
        const currentUserName = this.userData?.name || this.userData?.userName;

        this.shipments = allShipments.filter(shipment => {
          if (shipment.userId && currentUserId) {
            return shipment.userId === currentUserId;
          }
          if (shipment.userName && currentUserName) {
            return shipment.userName.toLowerCase() === currentUserName.toLowerCase();
          }
          return true;
        });
      }

      this.calculateStats();
    } catch (error) {
      console.error('Error loading shipments:', error);
      this.shipments = [];
    }
  }
  calculateAdminStats(): void {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    
    const shipmentsToday = this.shipments.filter(shipment => {
      const shippedDate = new Date(shipment.shippedAt);
      return shippedDate.toDateString() === today.toDateString();
    });

    const shipmentsThisWeek = this.shipments.filter(shipment => {
      const shippedDate = new Date(shipment.shippedAt);
      return shippedDate >= startOfWeek;
    });

    this.adminStats = {
      totalUsers: this.users.length,
      totalCustomers: this.customers.length,
      totalShipments: this.shipments.length,
      shipmentsToday: shipmentsToday.length,
      shipmentsThisWeek: shipmentsThisWeek.length
    };

    this.calculateStats();
  }

  getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 19) return 'Buenas tardes';
    return 'Buenas noches';
  }

getShortName(): string {
  if (this.isAdmin || this.isSuperAdmin) {
    if (this.userData?.role === 'SUPER_ADMIN' || this.userData?.role === 'SuperAdmin') {
      return 'Super Admin';
    } else if (this.userData?.role === 'ADMIN' || this.userData?.role === 'Admin') {
      return 'Admin';
    }
    return this.isSuperAdmin ? 'Super Admin' : 'Admin';
  }
  
  if (!this.userData?.name) return 'Usuario';
  const name = this.userData.name;
  return name.split(' ')[0];
}

  goToUsers(): void {
    this.router.navigate(['/admin/users']);
  }

  goToCustomers(): void {
    this.router.navigate(['/admin/customers']);
  }

  goToAllShipments(): void {
    this.router.navigate(['/admin/shipments']);
  }

  goToShipmentStatusChange(): void {
    this.router.navigate(['/admin/shipments/status']);
  }

  calculateStats(): void {
    if (!this.shipments || this.shipments.length === 0) {
      this.stats = {
        total: 0,
        habilitado: 0,
        empaquetado: 0,
        transito: 0,
        destino: 0,
        entregado: 0,
        devuelto: 0
      };
      return;
    }

    const stats = {
      total: this.shipments.length,
      habilitado: 0,
      empaquetado: 0,
      transito: 0,
      destino: 0,
      entregado: 0,
      devuelto: 0
    };

    this.shipments.forEach(shipment => {
      const status = shipment.shipmentStatus?.toString();
      
      switch(status) {
        case '1':
        case 'Habilitado':
          stats.habilitado++;
          break;
        case '2':
        case 'Empaquetado':
          stats.empaquetado++;
          break;
        case '3':
        case 'En Tránsito':
          stats.transito++;
          break;
        case '4':
        case 'LlegadaDestino':
        case 'Llegó a Destino':
          stats.destino++;
          break;
        case '5':
        case 'Entregado':
          stats.entregado++;
          break;
        case '6':
        case 'Devuelto':
          stats.devuelto++;
          break;
      }
    });

    this.stats = stats;
  }

  get filteredShipments(): Shipment[] {
    if (!this.shipments) return [];

    let filtered = this.shipments;

    if (this.filter !== 'all') {
      filtered = filtered.filter(shipment => {
        const status = shipment.shipmentStatus?.toString();
        
        switch(this.filter) {
          case '1':
            return status === '1' || status === 'Habilitado';
          case '2':
            return status === '2' || status === 'Empaquetado';
          case '3':
            return status === '3' || status === 'En Tránsito';
          case '4':
            return status === '4' || status === 'LlegadaDestino' || status === 'Llegó a Destino';
          case '5':
            return status === '5' || status === 'Entregado';
          case '6':
            return status === '6' || status === 'Devuelto';
          default:
            return true;
        }
      });
    }

    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(shipment =>
        shipment.trackingNumber?.toLowerCase().includes(query) ||
        shipment.destination?.toLowerCase().includes(query) ||
        shipment.customerName?.toLowerCase().includes(query) ||
        shipment.description?.toLowerCase().includes(query)
      );
    }

    return filtered
      .sort((a, b) => {
        const dateA = new Date(a.shippedAt);
        const dateB = new Date(b.shippedAt);
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, 2);
  }

  getStatusColor(status: string | undefined): string {
    if (!status) return 'secondary';

    const statusStr = status.toString();

    switch(statusStr) {
      case '1':
      case 'Habilitado':
        return 'warning';
      case '2':
      case 'Empaquetado':
        return 'info';
      case '3':
      case 'En Tránsito':
        return 'primary';
      case '4':
      case 'LlegadaDestino':
      case 'Llegó a Destino':
        return 'info';
      case '5':
      case 'Entregado':
        return 'success';
      case '6':
      case 'Devuelto':
        return 'danger';
      default:
        return 'secondary';
    }
  }

  getStatusText(status: string | undefined): string {
    if (!status) return 'Desconocido';

    const statusStr = status.toString();
    
    switch(statusStr) {
      case '1':
        return 'Habilitado';
      case '2':
        return 'Empaquetado';
      case '3':
        return 'En Tránsito';
      case '4':
        return 'Llegó a Destino';
      case '5':
        return 'Entregado';
      case '6':
        return 'Devuelto';
      case 'Habilitado':
        return 'Habilitado';
      case 'Empaquetado':
        return 'Empaquetado';
      case 'En Tránsito':
        return 'En Tránsito';
      case 'LlegadaDestino':
        return 'Llegó a Destino';
      case 'Entregado':
        return 'Entregado';
      case 'Devuelto':
        return 'Devuelto';
      default:
        return statusStr;
    }
  }

  getStatusIcon(status: string | undefined): string {
    if (!status) return 'fa-question-circle';

    const statusStr = status.toString();
    
    switch(statusStr) {
      case '1':
      case 'Habilitado':
        return 'fa-play-circle';
      case '2':
      case 'Empaquetado':
        return 'fa-box';
      case '3':
      case 'En Tránsito':
        return 'fa-truck';
      case '4':
      case 'LlegadaDestino':
        return 'fa-map-marker-alt';
      case '5':
      case 'Entregado':
        return 'fa-check-circle';
      case '6':
      case 'Devuelto':
        return 'fa-undo';
      default:
        return 'fa-question-circle';
    }
  }

  toggleUserMenu(): void {
    this.showUserMenu = !this.showUserMenu;
  }

  closeUserMenu(): void {
    this.showUserMenu = false;
  }

  handleClickOutside(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.user-menu')) {
      this.closeUserMenu();
    }
  }

  getUserInitial(): string {
    if (!this.userData?.name) return 'U';
    const name = this.userData.name;
    return name.charAt(0).toUpperCase();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

onRefresh(): void {
  this.refreshing = true;
  
  if (this.isAdmin || this.isSuperAdmin) {
    Promise.all([
      this.loadAllShipments(),
      this.loadAllUsers(),
      this.loadAllCustomers()
    ]).then(() => {
      this.calculateAdminStats();
      this.refreshing = false;
    }).catch(error => {
      console.error('Error refreshing data:', error);
      this.refreshing = false;
    });
  } else {
    this.loadUserShipments().then(() => {
      this.refreshing = false;
    }).catch(error => {
      console.error('Error refreshing shipments:', error);
      this.refreshing = false;
    });
  }
}

  viewAllShipments(): void {
    this.router.navigate(['/shipments/list']);
  }

  viewShipmentDetail(shipmentId: number): void {
    this.router.navigate(['/shipments/detail', shipmentId]);
  }

  createNewShipment(): void {
    this.router.navigate(['/shipments/create']);
  }
  
  setFilter(filter: string): void {
    this.filter = filter;
  }

  getActiveFilterName(): string {
    if (this.filter === 'all') return 'Todos';
    
    const status = this.statuses.find(s => s.code === this.filter);
    return status ? status.name : 'Todos';
  }
}