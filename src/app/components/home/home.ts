import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ShipmentService } from '../../services/shipment.service';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { Shipment } from '../../models/shipment.model';
import { User } from '../../models/user.model';

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
  loading: boolean = true;
  refreshing: boolean = false;
  searchQuery: string = '';
  filter: string = 'all';
  
  showUserMenu = false;
  userInitial: string = 'U';

  stats = {
    total: 0,
    active: 0,
    delivered: 0,
    pending: 0
  };

  constructor(
    private shipmentService: ShipmentService,
    private authService: AuthService,
    private userService: UserService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadUserData();
    
    document.addEventListener('click', this.handleClickOutside.bind(this));
  }

  ngOnDestroy(): void {
    document.removeEventListener('click', this.handleClickOutside.bind(this));
  }

  async loadUserData(): Promise<void> {
    try {
      this.userData = this.authService.getUser();

      if (!this.userData) {
        this.router.navigate(['/login']);
        return;
      }

      this.userInitial = this.getUserInitial();
      
      await this.loadShipments();

      this.loading = false;
      this.refreshing = false;
    } catch (error) {
      console.error('Error loading user data:', error);
      this.loading = false;
      this.refreshing = false;
    }
  }

  async loadShipments(): Promise<void> {
    try {
      const allShipments = await this.shipmentService.getAllShipments().toPromise() as Shipment[];

      if (!allShipments) {
        this.shipments = [];
      } else {
        const currentUserId = this.userData?.userId || this.userData?.id;

        this.shipments = allShipments.filter(shipment => {
          if (shipment.userId && currentUserId) {
            return shipment.userId === currentUserId;
          }
          if (shipment.userName && this.userData?.name) {
            return shipment.userName.toLowerCase() === this.userData.name.toLowerCase();
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

  calculateStats(): void {
    if (!this.shipments || this.shipments.length === 0) {
      this.stats = { total: 0, active: 0, delivered: 0, pending: 0 };
      return;
    }

    this.stats = {
      total: this.shipments.length,
      active: this.shipments.filter(s =>
        s.shipmentStatus !== 'Entregado' &&
        s.shipmentStatus !== 'Devuelto' &&
        s.shipmentStatus !== '5'
      ).length,
      delivered: this.shipments.filter(s =>
        s.shipmentStatus === 'Entregado' ||
        s.shipmentStatus === '5'
      ).length,
      pending: this.shipments.filter(s =>
        s.shipmentStatus === 'Pendiente' ||
        s.shipmentStatus === 'Habilitado' ||
        s.shipmentStatus === '1' ||
        s.shipmentStatus === '2'
      ).length
    };
  }

  get filteredShipments(): Shipment[] {
    if (!this.shipments) return [];

    const filtered = this.shipments.filter(shipment => {
      if (this.filter === 'active') {
        const deliveredStatuses = ['Entregado', 'Devuelto', '5', '6'];
        return !deliveredStatuses.includes(shipment.shipmentStatus);
      }
      if (this.filter === 'delivered') {
        return shipment.shipmentStatus === 'Entregado' || shipment.shipmentStatus === '5';
      }
      if (this.filter === 'pending') {
        const pendingStatuses = ['Pendiente', 'Habilitado', 'Empaquetado', '1', '2'];
        return pendingStatuses.includes(shipment.shipmentStatus);
      }

      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase();
        return (
          shipment.trackingNumber?.toLowerCase().includes(query) ||
          shipment.destination?.toLowerCase().includes(query) ||
          shipment.customerName?.toLowerCase().includes(query)
        );
      }
      return true;
    });

    return filtered
      .sort((a, b) => {
        const dateA = new Date(a.shippedAt);
        const dateB = new Date(b.shippedAt);
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, 2);
  }

  getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 19) return 'Buenas tardes';
    return 'Buenas noches';
  }

  getStatusColor(status: string | undefined): string {
    if (!status) return 'secondary';

    const statusStr = status.toString().toLowerCase();

    if (statusStr.includes('entregado') || status === '5') return 'success';
    if (statusStr.includes('habilitado') || status === '1') return 'warning';
    if (statusStr.includes('empaquetado') || status === '2') return 'info';
    if (statusStr.includes('tránsito') || status === '3') return 'primary';
    if (statusStr.includes('destino') || status === '4') return 'info';
    if (statusStr.includes('devuelto') || status === '6') return 'danger';
    if (statusStr.includes('pendiente')) return 'warning';

    return 'secondary';
  }

  getStatusText(status: string | undefined): string {
    if (!status) return 'Desconocido';

    const statusStr = status.toString();
    const statusMap: Record<string, string> = {
      '1': 'Habilitado',
      '2': 'Empaquetado',
      '3': 'En Tránsito',
      '4': 'Llegó a Destino',
      '5': 'Entregado',
      '6': 'Devuelto',
      'Habilitado': 'Habilitado',
      'Empaquetado': 'Empaquetado',
      'En Tránsito': 'En tránsito',
      'LlegadaDestino': 'Llegó a destino',
      'Entregado': 'Entregado',
      'Devuelto': 'Devuelto',
      'Pendiente': 'Pendiente'
    };

    return statusMap[statusStr] || statusStr;
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

  viewProfile(): void {
    this.router.navigate(['/profile']);
    this.closeUserMenu();
  }

  viewSettings(): void {
    this.router.navigate(['/settings']);
    this.closeUserMenu();
  }

  onRefresh(): void {
    this.refreshing = true;
    this.loadShipments();
  }

  viewAllShipments(): void {
    this.router.navigate(['/shipments']);
  }

  viewShipmentDetail(shipmentId: number): void {
    this.router.navigate(['/shipments', shipmentId]);
  }

  createNewShipment(): void {
    this.router.navigate(['/shipments/create']);
  }

  getShortName(): string {
    if (!this.userData?.name) return 'Usuario';
    const name = this.userData.name;
    return name.split(' ')[0];
  }
  
  setFilter(filter: string): void {
    this.filter = filter;
  }
}