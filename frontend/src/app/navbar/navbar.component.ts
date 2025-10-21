import { Component, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-navbar',
  standalone: true,
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent {
  @Output() loginClick = new EventEmitter<void>();
  
  onLoginClick() {
    this.loginClick.emit();
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
