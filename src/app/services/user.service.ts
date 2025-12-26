import { Injectable, inject } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Observable } from "rxjs";
import { environment } from "../../environments/environment";
import { User, CreateUser, UpdateUser } from "../models";

@Injectable({
  providedIn: "root"
})
export class UserService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/user`;

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') || '';
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.apiUrl, { headers: this.getHeaders() });
  }

  getUserById(userId: number): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${userId}`, { headers: this.getHeaders() });
  }

  createUser(user: CreateUser): Observable<User> {
    return this.http.post<User>(this.apiUrl, user, { headers: this.getHeaders() });
  }

  updateUser(userId: number, user: UpdateUser): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/${userId}`, user, { headers: this.getHeaders() });
  }

  deleteUser(userId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${userId}`, { headers: this.getHeaders() });
  }
}