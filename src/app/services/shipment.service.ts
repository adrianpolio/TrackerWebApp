import { Injectable, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { map, Observable } from "rxjs";
import { environment } from "../../environments/environment";
import { Shipment, CreateShipment, UpdateShipment, UpdateShipmentStatus } from "../models";

@Injectable({
	providedIn: "root"
})
export class ShipmentService {
	private http = inject(HttpClient);
	private apiUrl = `${environment.apiUrl}/Shipment`;

	getAllShipments(): Observable<Shipment[]> {
		return this.http.get<any[]>(this.apiUrl).pipe(
			map(data => data.map(item => ({
				...item,
				// Mapear shipmentStatusDescription a shipmentStatus
				shipmentStatus: item.shipmentStatusDescription,
				// Si el modelo espera estos campos, pero el API no los envía
				customerId: item.customerId || 0, // Valor por defecto
				userId: item.userId || 0 // Valor por defecto
			})))
		);
	}

	getShipmentById(shipmentId: number): Observable<Shipment> {
		return this.http.get<Shipment>(`${this.apiUrl}/${shipmentId}`);
	}

	createShipment(shipment: CreateShipment): Observable<Shipment> {
		return this.http.post<Shipment>(this.apiUrl, shipment);
	}

	updateShipment(shipmentId: number, shipment: UpdateShipment): Observable<Shipment> {
		return this.http.put<Shipment>(`${this.apiUrl}/${shipmentId}`, shipment);
	}

	deleteShipment(shipmentId: number): Observable<{ message: string }> {
		return this.http.delete<{ message: string }>(`${this.apiUrl}/${shipmentId}`);
	}

	updateShipmentStatus(shipmentId: number, status: UpdateShipmentStatus): Observable<Shipment> {
		return this.http.put<Shipment>(`${this.apiUrl}/${shipmentId}/status`, status);
	}
}
