import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private isDarkTheme = new BehaviorSubject<boolean>(true); // Por defecto tema oscuro
  public isDarkTheme$ = this.isDarkTheme.asObservable();
  private isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    
    // Cargar tema guardado del localStorage solo en el navegador
    if (this.isBrowser) {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) {
        this.isDarkTheme.next(savedTheme === 'dark');
      }
    }
  }

  toggleTheme(): void {
    const newTheme = !this.isDarkTheme.value;
    this.isDarkTheme.next(newTheme);
    
    // Guardar en localStorage solo en el navegador
    if (this.isBrowser) {
      localStorage.setItem('theme', newTheme ? 'dark' : 'light');
    }
  }

  getCurrentTheme(): boolean {
    return this.isDarkTheme.value;
  }
}
