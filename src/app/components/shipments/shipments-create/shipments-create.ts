import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ShipmentService } from '../../../services/shipment.service';
import { CustomerService } from '../../../services/customer.service';
import { AuthService } from '../../../services/auth.service';
import { CreateShipment } from '../../../models/shipment.model';
import { Customer } from '../../../models/customer.model';

@Component({
  selector: 'app-shipments-create',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './shipments-create.html',
  styleUrls: ['./shipments-create.scss']
})
export class ShipmentsCreate implements OnInit {
  private fb = inject(FormBuilder);
  private shipmentService = inject(ShipmentService);
  private customerService = inject(CustomerService);
  private authService = inject(AuthService);
  private router = inject(Router);

  shipmentForm: FormGroup;
  customers: Customer[] = [];
  loading: boolean = false;
  submitting: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';

  constructor() {
    this.shipmentForm = this.fb.group({
      customerId: ['', Validators.required],
      trackingNumber: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      description: ['', [Validators.required, Validators.maxLength(200)]],
      destination: ['', [Validators.required, Validators.maxLength(150)]]
    });
  }

  ngOnInit(): void {
    this.loadCustomers();
    this.generateTrackingNumber();
  }

  loadCustomers(): void {
    this.loading = true;
    this.customerService.getAllCustomers().subscribe({
      next: (customers) => {
        this.customers = customers;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading customers:', error);
        this.errorMessage = 'Error al cargar la lista de clientes';
        this.loading = false;
      }
    });
  }

  generateTrackingNumber(): void {
    const prefix = 'TRK-';
    const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const trackingNumber = `${prefix}${randomNum}`;
    
    this.shipmentForm.patchValue({
      trackingNumber: trackingNumber
    });
  }

onSubmit(): void {
  if (this.shipmentForm.invalid) {
    this.markFormGroupTouched(this.shipmentForm);
    return;
  }

  this.submitting = true;
  this.errorMessage = '';
  this.successMessage = '';

  const user = this.authService.getUser();
  if (!user || !user.userId) {
    this.errorMessage = 'Usuario no autenticado';
    this.submitting = false;
    return;
  }

  const formValue = this.shipmentForm.value;
  const shipmentData: CreateShipment = {
    customerId: parseInt(formValue.customerId),
    userId: user.userId,
    trackingNumber: formValue.trackingNumber,
    description: formValue.description,
    destination: formValue.destination
  };

  console.log('Enviando datos a la API:', shipmentData);

  this.shipmentService.createShipment(shipmentData).subscribe({
    next: (response) => {
      this.successMessage = `¡Envío creado exitosamente! Número de tracking: ${response.trackingNumber}`;
      this.submitting = false;
      
      setTimeout(() => {
        this.router.navigate(['/home']);
      }, 1500);
    },
    error: (error) => {
      console.error('Error creating shipment:', error);
      
      if (error.status === 400) {
        this.errorMessage = 'Datos inválidos. Verifica la información ingresada.';
      } else if (error.status === 401 || error.status === 403) {
        this.errorMessage = 'No tienes permisos para crear envíos';
      } else if (error.status === 404) {
        this.errorMessage = 'Cliente o usuario no encontrado';
      } else if (error.status === 0) {
        this.errorMessage = 'Error de conexión con el servidor';
      } else {
        this.errorMessage = error.error?.message || 'Error al crear el envío';
      }
      
      this.submitting = false;
    }
  });
}

  onCancel(): void {
    if (confirm('¿Seguro que quieres cancelar? Se perderán los datos no guardados.')) {
      this.router.navigate(['']);
    }
  }

  markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  get f() {
    return this.shipmentForm.controls;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.shipmentForm.get(fieldName);
    return field ? (field.invalid && (field.dirty || field.touched)) : false;
  }

  getFieldError(fieldName: string): string {
    const field = this.shipmentForm.get(fieldName);
    
    if (!field || !field.errors) return '';
    
    if (field.errors['required']) {
      return 'Este campo es requerido';
    }
    
    if (field.errors['minlength']) {
      return `Mínimo ${field.errors['minlength'].requiredLength} caracteres`;
    }
    
    if (field.errors['maxlength']) {
      return `Máximo ${field.errors['maxlength'].requiredLength} caracteres`;
    }
    
    return 'Campo inválido';
  }

  getSelectedCustomerName(): string {
    const customerId = this.shipmentForm.get('customerId')?.value;
    if (!customerId) return '';
    
    const customer = this.customers.find(c => c.customerId === parseInt(customerId));
    return customer ? customer.name : '';
  }
}