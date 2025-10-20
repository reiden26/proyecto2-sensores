import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogRef } from '@angular/material/dialog';
import { UsuarioService, RegisterRequest } from '../services/usuario.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatIconModule
  ],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  registerForm: FormGroup;
  isLoading = false;
  hidePassword = true;
  hideConfirmPassword = true;

  constructor(
    private usuarioService: UsuarioService,
    private router: Router,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private dialogRef: MatDialogRef<RegisterComponent>
  ) {
    this.registerForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(3)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    
    if (confirmPassword?.hasError('passwordMismatch')) {
      confirmPassword.setErrors(null);
    }
    
    return null;
  }

  register() {
    if (this.registerForm.valid && !this.isLoading) {
      this.isLoading = true;
      const { nombre, email, password } = this.registerForm.value;
      
      const userData: RegisterRequest = { nombre, email, password };
      
      this.usuarioService.register(userData).subscribe({
        next: (res: any) => {
          this.isLoading = false;
          
          // Mostrar notificación de éxito con botón de acción
          const snackBarRef = this.snackBar.open(
            'Usuario registrado correctamente. ¿Deseas iniciar sesión ahora?', 
            'Sí, iniciar sesión', 
            {
              duration: 0, // No se cierra automáticamente
              panelClass: ['success-snackbar'],
              horizontalPosition: 'center',
              verticalPosition: 'top'
            }
          );
          
          // Manejar el clic en el botón de la notificación
          snackBarRef.onAction().subscribe(() => {
            // Cerrar el diálogo de registro y abrir el de login
            this.dialogRef.close({ action: 'login', email: email });
          });
        },
        error: (err) => {
          this.isLoading = false;
          this.snackBar.open('Error al registrar: ' + (err?.error?.detail || err.message), 'Cerrar', {
            duration: 4000,
            panelClass: ['error-snackbar'],
            horizontalPosition: 'center',
            verticalPosition: 'top'
          });
        }
      });
    } else {
      this.snackBar.open('Por favor, completa todos los campos correctamente', 'Cerrar', {
        duration: 3000,
        panelClass: ['warning-snackbar'],
        horizontalPosition: 'center',
        verticalPosition: 'top'
      });
    }
  }

  getErrorMessage(field: string): string {
    const control = this.registerForm.get(field);
    if (control?.hasError('required')) {
      return 'Este campo es requerido';
    }
    if (field === 'email' && control?.hasError('email')) {
      return 'Ingresa un email válido';
    }
    if (field === 'password' && control?.hasError('minlength')) {
      return 'La contraseña debe tener al menos 3 caracteres';
    }
    if (field === 'nombre' && control?.hasError('minlength')) {
      return 'El nombre debe tener al menos 2 caracteres';
    }
    if (field === 'confirmPassword' && control?.hasError('passwordMismatch')) {
      return 'Las contraseñas no coinciden';
    }
    return '';
  }

  onLoginClick(): void {
    this.dialogRef.close('login');
  }

  closeModal(): void {
    this.dialogRef.close(); // Cierra el modal y regresa al landing page
  }
}
