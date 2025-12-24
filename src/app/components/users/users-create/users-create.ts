import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { UserService } from '../../../services/user.service';
import { CreateUser } from '../../../models/user.model';

@Component({
  selector: 'app-users-create',
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './users-create.html',
  styleUrl: './users-create.scss',
})
export class UsersCreate implements OnInit {
  registerForm!: FormGroup;
  showPassword = false;
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initForm();
  }

  initForm(): void {
    this.registerForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      passwordHash: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.markFormGroupTouched(this.registerForm);
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const userData: CreateUser = {
      passwordHash: this.registerForm.get('passwordHash')?.value,
      name: this.registerForm.get('name')?.value,
      email: this.registerForm.get('email')?.value,
      role: 'user', 
      isActive: true
    };

    this.userService.createUser(userData).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.successMessage = 'Usuario creado exitosamente. Ahora puedes iniciar sesión.';
        
        this.registerForm.reset();
        
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 3000);
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'Error al crear el usuario. Por favor, intenta nuevamente.';
        
        if (error.status === 400) {
          this.errorMessage = 'Datos inválidos. Verifica la información ingresada.';
        } else if (error.status === 409) {
          this.errorMessage = 'El correo electrónico ya está registrado.';
        }
        
        console.error('Error creating user:', error);
      }
    });
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }
}