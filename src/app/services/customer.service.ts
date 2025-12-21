import { Injectable, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { environment } from "../../environments/environment";
import { Customer, CreateCustomer, UpdateCustomer } from "../models";

@Injectable({
	providedIn: "root"
})
export class CustomerService {
	private http = inject(HttpClient);
	private apiUrl = `${environment.apiUrl}/customer`;

	getAllCustomers(): Observable<Customer[]> {
		return this.http.get<Customer[]>(this.apiUrl);
	}

	getCustomerById(customerId: number): Observable<Customer> {
		return this.http.get<Customer>(`${this.apiUrl}/${customerId}`);
	}

	createCustomer(customer: CreateCustomer): Observable<Customer> {
		return this.http.post<Customer>(this.apiUrl, customer);
	}

	updateCustomer(customerId: number, customer: UpdateCustomer): Observable<Customer> {
		return this.http.put<Customer>(`${this.apiUrl}/${customerId}`, customer);
	}

	deleteCustomer(customerId: number): Observable<{ message: string }> {
		return this.http.delete<{ message: string }>(`${this.apiUrl}/${customerId}`);
	}
}
