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
  
  updatingStatus: boolean = false;
  showUpdateForm: boolean = false;
  formattedCurrentDate: string = '';
  private dateInterval: any;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private shipmentService: ShipmentService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.updateCurrentDate(); // Formatear fecha inicial
    
    this.route.params.subscribe(params => {
      this.shipmentId = +params['id'];
      if (this.shipmentId) {
        this.loadShipmentDetails();
      } else {
        this.error = 'ID de envío no válido';
      }
    });
    
    // Actualizar fecha cada minuto
    this.dateInterval = setInterval(() => {
      this.updateCurrentDate();
    }, 60000); // 60000 ms = 1 minuto
  }

  ngOnDestroy(): void {
    // Limpiar intervalo cuando el componente se destruya
    if (this.dateInterval) {
      clearInterval(this.dateInterval);
    }
  }

  loadShipmentDetails(): void {
    if (!this.shipmentId) return;
    
    this.loading = true;
    this.error = null;
    
    this.shipmentService.getShipmentById(this.shipmentId)
      .subscribe({
        next: (data) => {
          this.shipment = data;
          this.loading = false;
          console.log('Detalles del envío:', data);
        },
        error: (err) => {
          this.error = 'Error al cargar los detalles del envío';
          this.loading = false;
          console.error('Error loading shipment details:', err);
          
          // Si es error 404, redirigir después de 2 segundos
          if (err.status === 404) {
            setTimeout(() => {
              this.router.navigate(['/shipments']);
            }, 2000);
          }
        }
      });
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

  // Marcar como entregado
  markAsDelivered(): void {
    if (!this.shipmentId || !this.shipment) return;
    
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
          alert('¡Envío marcado como entregado exitosamente!');
        },
        error: (err) => {
          this.updatingStatus = false;
          alert('Error al actualizar el estado del envío');
          console.error('Error updating status:', err);
        }
      });
  }

  // Cancelar envío
  cancelShipment(): void {
    if (!this.shipmentId || !this.shipment) return;
    
    if (!confirm('¿Está seguro de que desea cancelar este envío? Esta acción no se puede deshacer.')) {
      return;
    }
    
    this.shipmentService.deleteShipment(this.shipmentId)
      .subscribe({
        next: (response) => {
          alert(response.message);
          this.router.navigate(['/shipments']);
        },
        error: (err) => {
          alert('Error al cancelar el envío');
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