import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ShipmentService } from '../../services/shipment.service';
import { AuthService } from '../../services/auth.service';
import { Shipment } from '../../models';

@Component({
  selector: 'app-track',
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './track.html',
  styleUrl: './track.scss',
})
export class TrackComponent implements OnInit {
  trackingNumber: string = '';
  shipment: Shipment | null = null;
  loading: boolean = false;
  error: string | null = null;
  searchAttempted: boolean = false;
  
  recentSearches: string[] = [];
  recentShipments: Shipment[] = [];

  constructor(
    private shipmentService: ShipmentService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadRecentSearches();
    this.loadRecentShipments();
  }

  loadRecentSearches(): void {
    const searches = localStorage.getItem('recentTrackingSearches');
    this.recentSearches = searches ? JSON.parse(searches) : [];
  }

  saveRecentSearch(trackingNumber: string): void {
    if (!this.recentSearches.includes(trackingNumber)) {
      this.recentSearches.unshift(trackingNumber);
      this.recentSearches = this.recentSearches.slice(0, 5);
      localStorage.setItem('recentTrackingSearches', JSON.stringify(this.recentSearches));
    }
  }

  loadRecentShipments(): void {
    const userName = this.authService.getUserName();
    if (!userName) return;

    this.shipmentService.getAllShipments()
      .subscribe({
        next: (data) => {
          this.recentShipments = data
            .filter(shipment => shipment.userName === userName)
            .sort((a, b) => {
              const dateA = new Date(a.shippedAt).getTime();
              const dateB = new Date(b.shippedAt).getTime();
              return dateB - dateA;
            })
            .slice(0, 5);
        },
        error: (err) => {
          console.error('Error cargando envíos recientes:', err);
        }
      });
  }

  trackShipment(): void {
    if (!this.trackingNumber.trim()) {
      this.error = 'Por favor, ingresa un número de tracking';
      return;
    }

    this.shipment = null;
    this.error = null;
    this.loading = true;
    this.searchAttempted = true;

    const normalizedTracking = this.trackingNumber.trim().toUpperCase();

    this.shipmentService.getAllShipments()
      .subscribe({
        next: (shipments) => {
          const foundShipment = shipments.find(s => 
            s.trackingNumber.toUpperCase() === normalizedTracking
          );

          if (foundShipment) {
            this.shipment = foundShipment;
            this.saveRecentSearch(normalizedTracking);
          } else {
            this.error = `No se encontró ningún envío con el tracking: ${this.trackingNumber}`;
          }
          
          this.loading = false;
        },
        error: (err) => {
          this.error = 'Error al buscar el envío. Por favor, intenta nuevamente.';
          this.loading = false;
          console.error('Error tracking shipment:', err);
        }
      });
  }

  clearSearch(): void {
    this.trackingNumber = '';
    this.shipment = null;
    this.error = null;
    this.searchAttempted = false;
  }

  formatDate(dateString: string | Date | null | undefined): string {
    if (!dateString) return 'No especificada';
    
    try {
      const date = dateString instanceof Date ? dateString : new Date(dateString);
      
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

  getStatusText(status: string): string {
    if (!status) return 'Desconocido';
    
    const statusLower = status.toLowerCase();
    if (statusLower.includes('entregado')) return 'Entregado';
    if (statusLower.includes('habilitado')) return 'En tránsito';
    if (statusLower.includes('pendiente')) return 'Pendiente';
    return status;
  }

  copyTrackingNumber(): void {
    if (!this.shipment) return;
    
    navigator.clipboard.writeText(this.shipment.trackingNumber)
      .then(() => {
        console.log('Número de tracking copiado');
      })
      .catch(err => {
        console.error('Error al copiar:', err);
      });
  }

  useRecentSearch(trackingNumber: string): void {
    this.trackingNumber = trackingNumber;
    this.trackShipment();
  }

  goBack(): void {
    window.history.back();
  }
}