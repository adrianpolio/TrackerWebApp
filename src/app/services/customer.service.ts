import { Injectable, inject } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Observable } from "rxjs";
import { environment } from "../../environments/environment";
import { Customer, CreateCustomer, UpdateCustomer } from "../models";

@Injectable({
  providedIn: "root"
})
export class CustomerService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/customer`;

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') || '';
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  getAllCustomers(): Observable<Customer[]> {
    return this.http.get<Customer[]>(this.apiUrl, { headers: this.getHeaders() });
  }

  getCustomerById(customerId: number): Observable<Customer> {
    return this.http.get<Customer>(`${this.apiUrl}/${customerId}`, { headers: this.getHeaders() });
  }

  createCustomer(customer: CreateCustomer): Observable<Customer> {
    return this.http.post<Customer>(this.apiUrl, customer, { headers: this.getHeaders() });
  }

  updateCustomer(customerId: number, customer: UpdateCustomer): Observable<Customer> {
    return this.http.put<Customer>(`${this.apiUrl}/${customerId}`, customer, { headers: this.getHeaders() });
  }

  deleteCustomer(customerId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${customerId}`, { headers: this.getHeaders() });
  }
}