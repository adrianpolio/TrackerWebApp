export interface Customer {
	customerId: number;
	name: string;
	docmNumber: string;
	email: string;
	phone: string;
	customerTypeId: number;
	customerTypeDescription: string;
}

export interface CreateCustomer {
	name: string;
	docmNumber: string;
	email: string;
	phone: string;
	customerTypeId: number;
}

export interface UpdateCustomer {
	name: string;
	docmNumber: string;
	email: string;
	phone: string;
	customerTypeId: number;
}
