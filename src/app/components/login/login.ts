import { Component, inject, OnInit } from "@angular/core";
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { AuthService } from "../../services/auth.service";
import { LoginDto, AuthResponseDto } from "../../models/auth.model";
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { environment } from "../../../environments/environment";

export enum UserRole {
  User = 1,
  Admin = 2,
  SuperAdmin = 3
}

@Component({
  selector: "app-login",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: "./login.html",
  styleUrls: ["./login.scss"]
})
export class LoginComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  loginForm: FormGroup;
  errorMessage = "";
  showPassword: boolean = false;
  isLoading: boolean = false;
  isDevMode: boolean = !environment.production; 

  readonly ROLES = {
    USER: UserRole.User,
    ADMIN: UserRole.Admin,
    SUPER_ADMIN: UserRole.SuperAdmin
  };

  readonly ROLE_DISPLAY_NAMES: { [key: number]: string } = {
    [UserRole.User]: 'Usuario',
    [UserRole.Admin]: 'Administrador',
    [UserRole.SuperAdmin]: 'Super Administrador'
  };

  constructor() {
    this.loginForm = this.fb.group({
      email: ["", [Validators.required, Validators.email]],
      password: ["", Validators.required],
      rememberMe: [false]
    });
  }

  ngOnInit(): void {
    const rememberMe = localStorage.getItem('rememberMe');
    if (rememberMe === 'true') {
      this.loginForm.get('rememberMe')?.setValue(true);
    }
  }

  onSubmit() {
    if (this.loginForm.invalid) return;

    this.isLoading = true;
    this.errorMessage = "";

    const dto: LoginDto = this.loginForm.value;
    this.authService.login(dto).subscribe({
      next: (res: AuthResponseDto) => {
        this.isLoading = false;
        this.authService.setSession(res);
        
        if (res.role !== undefined) {
          const roleNumber = Number(res.role); 
          localStorage.setItem('userRole', roleNumber.toString());
          localStorage.setItem('userRoleName', this.getRoleDisplayName(roleNumber));
        }
        
        if (this.loginForm.get('rememberMe')?.value) {
          localStorage.setItem('rememberMe', 'true');
        } else {
          localStorage.removeItem('rememberMe');
        }
        
        this.redirectBasedOnRole(res.role ? Number(res.role) : undefined);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || err.error?.error || "Login failed";
        
        if (err.status === 401) {
          this.errorMessage = "Credenciales inválidas. Verifica tu email y contraseña.";
        } else if (err.status === 404) {
          this.errorMessage = "Usuario no encontrado.";
        } else if (err.status === 0) {
          this.errorMessage = "No se puede conectar con el servidor. Verifica tu conexión.";
        } else if (err.status >= 500) {
          this.errorMessage = "Error interno del servidor. Intenta nuevamente más tarde.";
        }
      }
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  getRoleDisplayName(roleId: number): string {
    return this.ROLE_DISPLAY_NAMES[roleId] || 'Usuario';
  }

  private redirectBasedOnRole(role?: number): void {
    switch(role) {
      case UserRole.SuperAdmin:
        this.router.navigate(['/admin/dashboard']);
        break;
      case UserRole.Admin:
        this.router.navigate(['/']);
        break;
      case UserRole.User:
      default:
        this.router.navigate(['']);
        break;
    }
  }

  clearForm(): void {
    this.loginForm.reset({
      email: '',
      password: '',
      rememberMe: false
    });
    this.errorMessage = '';
  }
}