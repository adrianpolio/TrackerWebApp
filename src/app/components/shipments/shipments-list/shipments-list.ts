import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ShipmentService } from '../../../services/shipment.service';
import { AuthService } from '../../../services/auth.service';
import { Shipment } from '../../../models';

@Component({
  selector: 'app-shipments-list',
  imports: [CommonModule, RouterModule],
  templateUrl: './shipments-list.html',
  styleUrl: './shipments-list.scss',
})
export class ShipmentsList implements OnInit {
  myShipments: Shipment[] = [];
  loading: boolean = false;
  error: string | null = null;
  currentUserName: string | null = null;

  constructor(
    private shipmentService: ShipmentService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.currentUserName = this.authService.getUserName();
    console.log('Usuario actual:', this.currentUserName);
    
    if (this.currentUserName) {
      this.loadMyShipments();
    } else {
      this.error = 'Usuario no autenticado';
    }
  }

  loadMyShipments(): void {
    this.loading = true;
    this.error = null;
    
    this.shipmentService.getAllShipments()
      .subscribe({
        next: (data) => {
          console.log('Datos recibidos del API:', data);
          
          this.myShipments = data.filter(
            shipment => shipment.userName === this.currentUserName
          );
          
          console.log('Envíos filtrados para', this.currentUserName, ':', this.myShipments);
          this.loading = false;
        },
        error: (err) => {
          this.error = 'Error al cargar tus envíos. Por favor, intente nuevamente.';
          this.loading = false;
          console.error('Error loading shipments:', err);
        }
      });
  }

  formatDate(dateString: string | Date | null | undefined): string {
    if (!dateString) return 'No entregado';
    
    try {
      const date = new Date(dateString);
      
      if (isNaN(date.getTime())) {
        return 'Fecha inválida';
      }
      
      return date.toLocaleDateString('es-PE', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formateando fecha:', dateString, error);
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

  countByStatus(status: string): number {
    return this.myShipments.filter(s => 
      s.shipmentStatus === status
    ).length;
  }

  cancelShipment(shipmentId: number): void {
    if (confirm('¿Estás seguro de que deseas cancelar este envío?')) {
      this.shipmentService.deleteShipment(shipmentId)
        .subscribe({
          next: (response) => {
            alert(response.message);
            this.loadMyShipments(); 
          },
          error: (err) => {
            alert('Error al cancelar el envío');
          }
        });
    }
  }
}