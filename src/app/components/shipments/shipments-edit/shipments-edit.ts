import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ShipmentService } from '../../../services/shipment.service';
import { AuthService } from '../../../services/auth.service';
import { Shipment, UpdateShipment } from '../../../models';

@Component({
  selector: 'app-shipments-edit',
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './shipments-edit.html',
  styleUrl: './shipments-edit.scss',
})
export class ShipmentsEdit implements OnInit {
  shipment: Shipment | null = null;
  loading: boolean = false;
  loadingData: boolean = false;
  error: string | null = null;
  successMessage: string | null = null;
  shipmentId: number | null = null;
  canEdit: boolean = false;
  currentUserId: number | null = null;
  currentUserName: string | null = null;
  isLoggedIn: boolean = false;

  editForm: FormGroup;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private shipmentService: ShipmentService,
    private authService: AuthService,
    private fb: FormBuilder
  ) {
    this.editForm = this.fb.group({
      description: ['', [Validators.required, Validators.maxLength(200)]],
      destination: ['', [Validators.required, Validators.maxLength(150)]],
      trackingNumber: [{ value: '', disabled: true }]
    });
  }

  ngOnInit(): void {
    this.isLoggedIn = this.authService.isLoggedIn();

    if (!this.isLoggedIn) {
      this.error = 'Debes iniciar sesión para acceder a esta página';
      setTimeout(() => {
        this.router.navigate(['/login']);
      }, 2000);
      return;
    }
    this.currentUserName = this.authService.getUserName();

    this.currentUserId = this.authService.getUserId();

    if (!this.currentUserId) {
      this.error = 'No se pudo identificar al usuario';
      setTimeout(() => {
        this.router.navigate(['/login']);
      }, 2000);
      return;
    }

    this.route.params.subscribe(params => {
      this.shipmentId = +params['id'];
      if (this.shipmentId) {
        this.loadShipmentData();
      } else {
        this.error = 'ID de envío no válido';
      }
    });
  }

  loadShipmentData(): void {
    if (!this.shipmentId) return;

    this.loadingData = true;
    this.error = null;
    this.canEdit = false;

    this.shipmentService.getShipmentById(this.shipmentId)
      .subscribe({
        next: (data) => {
          this.shipment = data;

          console.log('Edit - Datos del envío:', data);

          if (this.currentUserName && data.userName) {
            const shipmentUserName = data.userName.trim().toLowerCase();
            const currentUserName = this.currentUserName.trim().toLowerCase();

            const isCreator = shipmentUserName === currentUserName;
            const isDelivered = data.shipmentStatusDescription === 'Entregado';

            console.log('Edit - Comparando nombres:');
            console.log('  - shipment.userName:', data.userName, '→', shipmentUserName);
            console.log('  - currentUserName:', this.currentUserName, '→', currentUserName);
            console.log('  - ¿Es el creador?:', isCreator);
            console.log('  - ¿Está entregado?:', isDelivered);

            if (isCreator && !isDelivered) {
              this.canEdit = true;
              this.editForm.patchValue({
                description: data.description,
                destination: data.destination,
                trackingNumber: data.trackingNumber
              });
              console.log('EDIT - PERMISO CONCEDIDO');
            } else if (isCreator && isDelivered) {
              this.canEdit = false;
              this.error = 'No se puede editar un envío que ya ha sido entregado';
              console.log('EDIT - PERMISO DENEGADO: Envío entregado');
            } else {
              this.canEdit = false;
              this.error = 'No tienes permiso para editar este envío. Solo el creador puede modificarlo.';
              console.log('EDIT - PERMISO DENEGADO: No es el creador');

              setTimeout(() => {
                this.router.navigate(['/shipments/detail', this.shipmentId]);
              }, 3000);
            }
          } else {
            this.canEdit = false;
            this.error = 'No se pudo verificar la identidad del usuario';
          }

          this.loadingData = false;
        },
        error: (err) => {
          this.error = 'Error al cargar los datos del envío';
          this.loadingData = false;
          console.error('Error loading shipment data:', err);

          if (err.status === 404) {
            setTimeout(() => {
              this.router.navigate(['/']);
            }, 2000);
          }
        }
      });
  }


  isFieldInvalid(fieldName: string): boolean {
    const field = this.editForm.get(fieldName);
    return field ? field.invalid && (field.dirty || field.touched) : false;
  }

  getFieldError(fieldName: string): string {
    const field = this.editForm.get(fieldName);

    if (!field || !field.errors) return '';

    if (field.errors['required']) {
      return 'Este campo es requerido';
    }

    if (field.errors['maxlength']) {
      const maxLength = field.errors['maxlength'].requiredLength;
      return `Máximo ${maxLength} caracteres`;
    }

    return 'Campo inválido';
  }

  onSubmit(): void {
    if (!this.canEdit || !this.shipmentId || !this.shipment) {
      this.error = 'No tienes permiso para editar este envío';
      return;
    }

    if (this.editForm.invalid) {
      this.markAllFieldsAsTouched();
      return;
    }

    const formValues = this.editForm.getRawValue();
    const hasChanges =
      formValues.description !== this.shipment.description ||
      formValues.destination !== this.shipment.destination;

    if (!hasChanges) {
      this.successMessage = 'No se detectaron cambios para actualizar.';
      setTimeout(() => {
        this.successMessage = null;
      }, 3000);
      return;
    }

    this.loading = true;
    this.error = null;
    this.successMessage = null;

    const updateData: UpdateShipment = {
      shipmentId: this.shipmentId,
      trackingNumber: this.shipment.trackingNumber,
      description: formValues.description,
      destination: formValues.destination
    };

    console.log('Datos a actualizar:', updateData);

    this.shipmentService.updateShipment(this.shipmentId, updateData)
      .subscribe({
        next: (updatedShipment) => {
          this.shipment = updatedShipment;
          this.loading = false;
          this.successMessage = '¡Envío actualizado exitosamente!';

          setTimeout(() => {
            this.router.navigate(['/', this.shipmentId]);
          }, 2000);
        },
        error: (err) => {
          this.loading = false;

          if (err.status === 400) {
            this.error = 'Datos inválidos. Por favor, verifica la información.';
          } else if (err.status === 404) {
            this.error = 'El envío no fue encontrado.';
          } else if (err.status === 403) {
            this.error = 'No tienes permiso para editar este envío.';
          } else {
            this.error = 'Error al actualizar el envío. Por favor, intente nuevamente.';
          }

          console.error('Error updating shipment:', err);
        }
      });
  }
  markAllFieldsAsTouched(): void {
    Object.keys(this.editForm.controls).forEach(field => {
      const control = this.editForm.get(field);
      if (control && control.enabled) {
        control.markAsTouched({ onlySelf: true });
      }
    });
  }

  cancelEdit(): void {
    if (this.editForm.dirty) {
      const confirmCancel = confirm('Tienes cambios sin guardar. ¿Seguro que quieres salir?');
      if (!confirmCancel) return;
    }

    this.router.navigate(['/shipments/detail', this.shipmentId]);
  }

  goBack(): void {
    this.cancelEdit();
  }

  getRemainingChars(fieldName: string, maxLength: number): number {
    const field = this.editForm.get(fieldName);
    const value = field ? field.value : '';
    return maxLength - (value ? value.length : 0);
  }
}