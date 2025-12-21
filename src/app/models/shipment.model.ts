export interface Shipment {
	shipmentId: number;
	trackingNumber: string;
	shippedAt: Date;
	description: string;
	destination: string;
	receivedBy: string;
	receivedAt?: Date;
	shipmentStatus: string;
	customerName: string;
	userName: string;
}

export interface CreateShipment {
	customerId: number;
	userId: number;
	trackingNumber: string;
	description: string;
	destination: string;
}

export interface UpdateShipment {
	shipmentId: number;
	trackingNumber: string;
	description: string;
	destination: string;
}

export interface UpdateShipmentStatus {
	shipmentId: number;
	shipmentStatus: string;
	receivedBy?: string;
	receivedAt?: Date;
}
