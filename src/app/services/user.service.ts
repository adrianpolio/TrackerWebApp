import { Injectable, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { environment } from "../../environments/environment";
import { User, CreateUser, UpdateUser } from "../models";

@Injectable({
	providedIn: "root"
})
export class UserService {
	private http = inject(HttpClient);
	private apiUrl = `${environment.apiUrl}/user`;

	getAllUsers(): Observable<User[]> {
		return this.http.get<User[]>(this.apiUrl);
	}

	getUserById(userId: number): Observable<User> {
		return this.http.get<User>(`${this.apiUrl}/${userId}`);
	}

	createUser(user: CreateUser): Observable<User> {
		return this.http.post<User>(this.apiUrl, user);
	}

	updateUser(userId: number, user: UpdateUser): Observable<User> {
		return this.http.put<User>(`${this.apiUrl}/${userId}`, user);
	}

	deleteUser(userId: number): Observable<{ message: string }> {
		return this.http.delete<{ message: string }>(`${this.apiUrl}/${userId}`);
	}
}
