import { Component, Inject } from '@angular/core';
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
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { UsuarioService, LoginRequest } from '../services/usuario.service';

import {
  trigger,
  state,
  style,
  transition,
  animate
} from '@angular/animations';

@Component({
  selector: 'app-login',
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
    MatIconModule,
    MatCheckboxModule
  ], 
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  animations: [
    trigger('cardAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(50px) scale(0.9)' }),
        animate('600ms cubic-bezier(0.34, 1.56, 0.64, 1)',
          style({ opacity: 1, transform: 'translateY(0) scale(1)' })
        )
      ]),
      transition(':leave', [
        animate('400ms ease-out',
          style({ opacity: 0, transform: 'translateY(50px) scale(0.9)' })
        )
      ])
    ])
  ]
})
export class LoginComponent {
  loginForm: FormGroup;
  isLoading = false;
  hidePassword = true;
  showCard = 'false'; // 👈 estado inicial

  constructor(
    private usuarioService: UsuarioService,
    private router: Router,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private dialogRef: MatDialogRef<LoginComponent>,
    @Inject(MAT_DIALOG_DATA) private data: any
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(3)]],
      rememberMe: [false]
    });

    this.loadSavedEmail();
  }

  ngOnInit(): void {
    // 👇 Activa la animación luego de un delay para que primero aparezca el fondo
    setTimeout(() => {
      this.showCard = 'true';
    }, 300);
  }

  private loadSavedEmail(): void {
    if (this.data && this.data.email) {
      this.loginForm.patchValue({ email: this.data.email });
      return;
    }
    
    const savedEmail = localStorage.getItem('rememberedEmail');
    if (savedEmail) {
      this.loginForm.patchValue({ rememberMe: true });
    }
  }

  onEmailFocus(): void {
    const savedEmail = localStorage.getItem('rememberedEmail');
    if (savedEmail && !this.loginForm.get('email')?.value) {
      this.loginForm.patchValue({ email: savedEmail, rememberMe: true });
    }
  }

  login() {
    if (this.loginForm.valid && !this.isLoading) {
      this.isLoading = true;
      const formValue = this.loginForm.value;
      const credentials: LoginRequest = {
        email: formValue.email,
        password: formValue.password
      };
      
      this.usuarioService.login(credentials).subscribe({
        next: (res) => {
          this.isLoading = false;
          
          if (formValue.rememberMe) {
            localStorage.setItem('rememberedEmail', formValue.email);
          } else {
            localStorage.removeItem('rememberedEmail');
          }
          
          this.snackBar.open(`Inicio de sesión exitoso como ${res.rol}`, 'Cerrar', {
            duration: 3000,
            panelClass: ['success-snackbar'],
            horizontalPosition: 'center',
            verticalPosition: 'top'
          });
          
          this.dialogRef.close();
          
          if (res.rol.toLowerCase() === 'admin') {
            this.router.navigate(['/admin']);
          } else if (res.rol.toLowerCase() === 'usuario') {
            this.router.navigate(['/usuario']);
          }
        },
        error: () => {
          this.isLoading = false;
          this.snackBar.open('Credenciales incorrectas', 'Cerrar', {
            duration: 3000,
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

  onRegisterClick(): void {
    this.dialogRef.close('register');
  }

  closeModal(): void {
    this.dialogRef.close();
  }

  getErrorMessage(field: string): string {
    const control = this.loginForm.get(field);
    if (control?.hasError('required')) {
      return 'Este campo es requerido';
    }
    if (field === 'email' && control?.hasError('email')) {
      return 'Ingresa un email válido';
    }
    if (field === 'password' && control?.hasError('minlength')) {
      return 'La contraseña debe tener al menos 3 caracteres';
    }
    return '';
  }
}
