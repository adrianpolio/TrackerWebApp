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
				shipmentStatus: item.shipmentStatusDescription,
				customerId: item.customerId || 0,
				userId: item.userId || 0
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

	updateShipmentStatus(shipmentId: number,data: UpdateShipmentStatus) {
		return this.http.patch(`${this.apiUrl}/${shipmentId}/status`,data);
	}
}