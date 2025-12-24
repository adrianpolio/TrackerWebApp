import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { ShipmentService } from '../../../services/shipment.service';
import { AuthService } from '../../../services/auth.service';
import { Shipment } from '../../../models';

@Component({
  selector: 'app-shipments-detail',
  imports: [CommonModule, RouterModule],
  templateUrl: './shipments-detail.html',
  styleUrl: './shipments-detail.scss',
})
export class ShipmentsDetail implements OnInit, OnDestroy {
  shipment: Shipment | null = null;
  loading: boolean = false;
  error: string | null = null;
  shipmentId: number | null = null;
  canDelete: boolean = false;
  canEdit: boolean = false;
  currentUserId: number | null = null;
  currentUserName: string | null = null;
  isLoggedIn: boolean = false;
  permissionMessage: string = '';
  isCreator: boolean = false; 
  updatingStatus: boolean = false;
  showUpdateForm: boolean = false;
  formattedCurrentDate: string = '';
  private dateInterval: any;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private shipmentService: ShipmentService,
    public authService: AuthService
  ) { }

  ngOnInit(): void {
    this.isLoggedIn = this.authService.isLoggedIn();

    if (!this.isLoggedIn) {
      this.error = 'Debes iniciar sesión para ver los detalles del envío';
      setTimeout(() => {
        this.router.navigate(['/login']);
      }, 2000);
      return;
    }

    this.currentUserId = this.authService.getUserId();
    this.currentUserName = this.authService.getUserName();
    this.updateCurrentDate();

    this.route.params.subscribe(params => {
      this.shipmentId = +params['id'];
      if (this.shipmentId) {
        this.loadShipmentDetails();
      } else {
        this.error = 'ID de envío no válido';
      }
    });

    this.dateInterval = setInterval(() => {
      this.updateCurrentDate();
    }, 60000);
  }

  ngOnDestroy(): void {
    if (this.dateInterval) {
      clearInterval(this.dateInterval);
    }
  }

  loadShipmentDetails(): void {
    if (!this.shipmentId) return;

    this.loading = true;
    this.error = null;
    this.canDelete = false;
    this.canEdit = false;
    this.isCreator = false; 

    this.shipmentService.getShipmentById(this.shipmentId)
      .subscribe({
        next: (data) => {
          this.shipment = data;
          this.checkPermissions(data);
          this.loading = false;
          console.log('Detalles del envío:', data);
        },
        error: (err) => {
          this.handleLoadError(err);
        }
      });
  }

  private checkPermissions(shipment: Shipment): void {
    if (!this.currentUserName) {
      this.canDelete = false;
      this.canEdit = false;
      this.isCreator = false;
      this.permissionMessage = 'Usuario no identificado';
      return;
    }

    const shipmentUserName = shipment.userName?.trim().toLowerCase() || '';
    const currentUserName = this.currentUserName?.trim().toLowerCase() || '';

    this.isCreator = shipmentUserName === currentUserName;
    const isDelivered = shipment.shipmentStatusDescription === 'Entregado';

    if (this.isCreator && !isDelivered) {
      this.canDelete = true;
      this.canEdit = true;
      this.permissionMessage = 'Tienes permiso para editar y eliminar este envío';
      console.log('PERMISO CONCEDIDO');
    } else if (this.isCreator && isDelivered) {
      this.canDelete = false;
      this.canEdit = false;
      this.permissionMessage = 'No se puede editar o eliminar un envío que ya ha sido entregado';
      console.log('PERMISO DENEGADO: Envío entregado');
    } else {
      this.canDelete = false;
      this.canEdit = false;
      this.permissionMessage = `Solo el creador del envío (${shipment.userName}) puede editarlo o eliminarlo`;
      console.log('PERMISO DENEGADO: No es el creador');
    }

    console.log('Permisos calculados:', {
      isCreator: this.isCreator,
      canEdit: this.canEdit,
      canDelete: this.canDelete,
      estado: shipment.shipmentStatusDescription
    });
  }

  private handleLoadError(err: any): void {
    this.error = 'Error al cargar los detalles del envío';
    this.loading = false;
    console.error('Error loading shipment details:', err);

    if (err.status === 404) {
      this.error = 'El envío no fue encontrado';
      setTimeout(() => {
        this.router.navigate(['/']);
      }, 2000);
    } else if (err.status === 403) {
      this.error = 'No tienes permiso para acceder a este envío';
      setTimeout(() => {
        this.router.navigate(['/']);
      }, 2000);
    }
  }

  updateCurrentDate(): void {
    const currentDate = new Date();
    this.formattedCurrentDate = this.formatDate(currentDate);
  }

  formatDate(dateString: string | Date | null | undefined): string {
    if (!dateString) return 'No especificada';

    try {
      const date = new Date(dateString);

      if (isNaN(date.getTime())) {
        return 'Fecha inválida';
      }

      return date.toLocaleDateString('es-PE', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch (error) {
      return 'Fecha inválida';
    }
  }

  getStatusClass(status: string): string {
    if (!status) return 'status-other';

    const statusLower = status.toLowerCase();
    if (statusLower.includes('entregado')) return 'status-delivered';
    if (statusLower.includes('habilitado')) return 'status-enabled';
    if (statusLower.includes('pendiente')) return 'status-pending';
    return 'status-other';
  }

  getStatusIcon(status: string): string {
    if (!status) return 'fa-question-circle';

    const statusLower = status.toLowerCase();
    if (statusLower.includes('entregado')) return 'fa-check-circle';
    if (statusLower.includes('habilitado')) return 'fa-shipping-fast';
    if (statusLower.includes('pendiente')) return 'fa-clock';
    return 'fa-box';
  }

  markAsDelivered(): void {
    if (!this.shipmentId || !this.shipment) return;

    if (!this.canEdit) {
      alert('Solo el creador del envío puede marcar como entregado');
      return;
    }

    const receivedBy = prompt('Ingrese el nombre de quien recibió el envío:');
    if (!receivedBy) {
      alert('Debe ingresar el nombre del receptor');
      return;
    }

    this.updatingStatus = true;

    const statusUpdate = {
      shipmentId: this.shipmentId,
      shipmentStatus: 'Entregado',
      receivedBy: receivedBy,
      receivedAt: new Date()
    };

    this.shipmentService.updateShipmentStatus(this.shipmentId, statusUpdate)
      .subscribe({
        next: (updated) => {
          this.shipment = updated;
          this.updatingStatus = false;
          this.canDelete = false;
          this.canEdit = false;
          this.isCreator = false;
          alert('¡Envío marcado como entregado exitosamente!');
        },
        error: (err) => {
          this.updatingStatus = false;

          if (err.status === 403) {
            alert('No tienes permiso para actualizar este envío');
          } else {
            alert('Error al actualizar el estado del envío');
          }
          console.error('Error updating status:', err);
        }
      });
  }

  cancelShipment(): void {
    if (!this.shipmentId || !this.shipment || !this.canDelete) {
      alert('No tienes permiso para eliminar este envío. Solo el creador puede cancelarlo.');
      return;
    }

    if (!confirm('¿Está seguro de que desea cancelar este envío? Esta acción no se puede deshacer.')) {
      return;
    }

    this.shipmentService.deleteShipment(this.shipmentId)
      .subscribe({
        next: (response) => {
          alert(response.message);
          this.router.navigate(['/']);
        },
        error: (err) => {
          if (err.status === 403) {
            alert('No tienes permiso para eliminar este envío');
          } else if (err.status === 409) {
            alert('No se puede cancelar un envío que ya ha sido entregado');
          } else {
            alert('Error al cancelar el envío');
          }
          console.error('Error deleting shipment:', err);
        }
      });
  }

  goBack(): void {
    this.router.navigate(['/']);
  }

  copyTrackingNumber(): void {
    if (!this.shipment) return;

    navigator.clipboard.writeText(this.shipment.trackingNumber)
      .then(() => {
        alert('Número de tracking copiado al portapapeles');
      })
      .catch(err => {
        console.error('Error al copiar:', err);
      });
  }
}