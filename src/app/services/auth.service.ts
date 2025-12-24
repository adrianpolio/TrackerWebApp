import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from "../../environments/environment";
import { LoginDto, AuthResponseDto } from '../models/auth.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/Auth`;

  login(dto: LoginDto): Observable<AuthResponseDto> {
    return this.http.post<AuthResponseDto>(`${this.apiUrl}/login`, dto);
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  setSession(auth: AuthResponseDto) {
    localStorage.setItem('token', auth.token);
    localStorage.setItem('user', JSON.stringify(auth));
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getUser(): any | null {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  getUserId(): number | null {
    const user = this.getUser();
    return user ? (user.userId || user.id) : null;
  }

  getUserName(): string | null {
    const user = this.getUser();
    return user ? user.name : null;
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }
}