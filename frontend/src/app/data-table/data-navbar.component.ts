import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'data-navbar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <nav class="data-navbar">
      <div class="nav-left">
        <div class="dropdown">
                     <button class="nav-btn dropdown-toggle" (click)="toggleDropdown()">
             ☰
           </button>
          <div class="dropdown-menu" [class.show]="showDropdown">
            <button class="dropdown-item" (click)="goToAdmin()">
              🏠 Panel Principal
            </button>
            <button class="dropdown-item" (click)="goToData()">
              📊 Gestión de Datos
            </button>
          </div>
        </div>
      </div>
      <div class="nav-right">
        <button class="logout-btn" (click)="logout()">Cerrar sesión</button>
      </div>
    </nav>
  `,
  styleUrls: ['./data-navbar.component.css']
})
export class DataNavbarComponent implements OnInit, OnDestroy {
  showDropdown = false;
  
  constructor(private router: Router) {}
  
  ngOnInit() {
    // Agregar event listener para cerrar dropdown al hacer clic fuera
    document.addEventListener('click', this.onDocumentClick.bind(this));
  }
  
  ngOnDestroy() {
    // Remover event listener al destruir el componente
    document.removeEventListener('click', this.onDocumentClick.bind(this));
  }
  
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.closest('.dropdown')) {
      this.showDropdown = false;
    }
  }
  
  toggleDropdown() {
    this.showDropdown = !this.showDropdown;
  }
  
  goToAdmin() {
    this.router.navigate(['/admin']);
    this.showDropdown = false;
  }
  
  goToData() {
    this.router.navigate(['/datos']);
    this.showDropdown = false;
  }
  
  logout() {
    localStorage.removeItem('token');
    this.router.navigate(['/']);
  }
}
