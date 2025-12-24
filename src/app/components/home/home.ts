import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ShipmentService } from '../../services/shipment.service';
import { Shipment } from '../../models'; 

@Component({
  selector: 'app-home',
  templateUrl: './home.html',
  styleUrls: ['./home.scss'],
})
export class Home {
  constructor(private router: Router, private shipmentService: ShipmentService) {}

  goTo(route: string) {
    this.router.navigate([route]);
  }

  goToTracking(code: string) {
    if (!code.trim()) return;

    this.shipmentService.getAllShipments().subscribe({
      next: (shipments) => {
        const shipment = shipments.find(
          (s) => s.trackingNumber.toLowerCase() === code.toLowerCase()
        );

        if (shipment) {
          this.router.navigate(['/'], { state: { shipment } }); //Navegar al home por ahora
          alert('Tracking encontrado: ' + shipment.trackingNumber);
        } else {
          alert('Número de tracking no encontrado');
        }
      },
      error: (err) => {
        console.error(err);
        alert('Error al obtener los envíos');
      },
    });
  }
}
