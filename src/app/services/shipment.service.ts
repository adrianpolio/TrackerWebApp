import { Injectable, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { environment } from "../../environments/environment";
import { Shipment, CreateShipment, UpdateShipment, UpdateShipmentStatus } from "../models";

@Injectable({
	providedIn: "root"
})
export class ShipmentService {
	private http = inject(HttpClient);
	private apiUrl = `${environment.apiUrl}/shipment`;

	getAllShipments(): Observable<Shipment[]> {
		return this.http.get<Shipment[]>(this.apiUrl);
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
