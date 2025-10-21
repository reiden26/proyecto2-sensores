import { Component, Output, EventEmitter, HostListener } from '@angular/core';

@Component({
  selector: 'app-navbar',
  standalone: true,
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent {
  @Output() loginClick = new EventEmitter<void>();
  
  isMobileMenuOpen = false;
  
  onLoginClick() {
    this.loginClick.emit();
  }
  
  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
    // Prevenir scroll del body cuando el menú está abierto
    if (this.isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }
  
  closeMobileMenu() {
    this.isMobileMenuOpen = false;
    document.body.style.overflow = '';
  }
  
  // Cerrar menú móvil al cambiar el tamaño de la ventana
  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    if (event.target.innerWidth > 768) {
      this.closeMobileMenu();
    }
  }
  
  // Cerrar menú móvil al hacer scroll
  @HostListener('window:scroll', ['$event'])
  onScroll(event: any) {
    if (this.isMobileMenuOpen) {
      this.closeMobileMenu();
    }
  }
  
  scrollToTop(event: Event) {
    event.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  scrollToTechnology(event: Event) {
    event.preventDefault();
    const sectionById = document.getElementById('tech-section');
    const sectionByCmp = document.querySelector('app-project-info');
    const target = sectionById || sectionByCmp;
    if (target) { target.scrollIntoView({ behavior: 'smooth' }); }
  }

  scrollToCarousel(event: Event) {
    event.preventDefault();
    const carousel = document.querySelector('#carousel-section') || document.querySelector('app-carousel');
    if (carousel) {
      carousel.scrollIntoView({ behavior: 'smooth' });
    }
  }
}
