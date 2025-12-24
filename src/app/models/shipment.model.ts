export interface Shipment {
  shipmentId: number;
  trackingNumber: string;
  shippedAt: Date | string;
  description: string;
  destination: string;
  receivedBy: string;
  receivedAt?: Date | string;
  shipmentStatus: string;
  customerName: string;
  userName: string;
  customerId: number;
  userId: number;

   shipmentStatusDescription: string; 
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