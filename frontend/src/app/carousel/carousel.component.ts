import { Component, OnInit, OnDestroy, HostBinding, Inject, PLATFORM_ID } from '@angular/core';
import { ThemeService } from '../services/theme.service';
import { Subscription, interval, timer } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { isPlatformBrowser } from '@angular/common';
import { ProductGalleryDialogComponent } from './product-gallery-dialog.component';

@Component({
  selector: 'app-carousel',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatDialogModule],
  templateUrl: './carousel.component.html',
  styleUrls: ['./carousel.component.css']
})
export class CarouselComponent implements OnInit, OnDestroy {
  isDarkTheme: boolean = true;
  private themeSubscription: Subscription = new Subscription();
  private autoSub?: Subscription;
  private autoCardSub?: Subscription;
  showBackToTop: boolean = false;
  
  // Carrusel de tarjetas (lado izquierdo)
  toolCards = [
    {
      icon: 'dashboard',
      title: 'Interfaz',
      badges: ['Dashboard', 'Gráficos', 'Alertas', 'Reportes']
    },
    {
      icon: 'analytics',
      title: 'Procesamiento',
      badges: ['Algoritmos', 'Análisis', 'Base de Datos', 'APIs']
    },
    {
      icon: 'wifi',
      title: 'Comunicación',
      badges: ['WiFi', 'WebSocket', 'Tiempo Real']
    }
  ];
  cardIndex = 0;

  constructor(
    private themeService: ThemeService,
    private dialog: MatDialog,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  @HostBinding('class.light-theme') get lightTheme() {
    return !this.isDarkTheme;
  }

  images = [
    { src: '/Sensor1.png', desc: 'El MQ-135 detecta gases tóxicos en el aire, útil para medir calidad del aire en interiores.' },
    { src: '/Sensor2.png', desc: 'El MQ-135 detecta gases contaminantes como amoníaco, benceno, humo y CO₂.' },
    { src: '/Sensor3.png', desc: 'El MQ-7 detecta monóxido de carbono (CO) en el aire.' },
    { src: '/Sensor4.png', desc: 'El MQ-4 detecta gas metano (CH₄) y gas natural.' },
    { src: '/proto.png', desc: 'Protoboard para el montaje del circuito.' },
    { src: '/esp32.png', desc: 'Esp32 para el control del circuito.' }
  ];
  current = 0;

  ngOnInit(): void {
    this.themeSubscription = this.themeService.isDarkTheme$.subscribe(isDark => this.isDarkTheme = isDark);
    if (isPlatformBrowser(this.platformId)) {
      this.startAutoplay();
      this.startCardAutoplay();
      window.addEventListener('scroll', this.onScroll, { passive: true });
    }
  }

  ngOnDestroy(): void { 
    this.themeSubscription.unsubscribe(); 
    this.stopAutoplay(); 
    this.stopCardAutoplay(); 
    if (isPlatformBrowser(this.platformId)) {
      window.removeEventListener('scroll', this.onScroll);
    }
  }

  private startAutoplay(): void {
    this.stopAutoplay();
    // Espera 3s desde el último cambio y luego avanza, repitiendo cada 3s
    this.autoSub = timer(3000, 3000).subscribe(() => this.next(false));
  }

  private stopAutoplay(): void { this.autoSub?.unsubscribe(); this.autoSub = undefined; }

  // Autoplay para las tarjetas (mismos segundos que el carrusel de imágenes)
  private startCardAutoplay(): void {
    this.stopCardAutoplay();
    this.autoCardSub = timer(3000, 3000).subscribe(() => this.nextCardInternal());
  }

  private stopCardAutoplay(): void { this.autoCardSub?.unsubscribe(); this.autoCardSub = undefined; }

  // when user or autoplay advances, optionally restart timer only for manual actions
  next(manual: boolean = true) {
    this.current = (this.current + 1) % this.images.length;
    if (manual) this.startAutoplay();
  }

  goTo(i: number) {
    this.current = i;
    this.startAutoplay();
  }

  openZoomModal() {
    if (isPlatformBrowser(this.platformId)) {
      this.dialog.open(ProductGalleryDialogComponent, {
        data: { images: this.images, currentIndex: this.current },
        maxWidth: '95vw', maxHeight: '95vh', width: '1000px', panelClass: 'zoom-dialog'
      });
    }
  }

  scrollToTop() {
    if (isPlatformBrowser(this.platformId)) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  private onScroll = () => {
    const element = document.getElementById('carousel-section');
    if (!element) { this.showBackToTop = false; return; }
    const rect = element.getBoundingClientRect();
    // Mostrar cuando el carrusel está parcialmente en viewport o ya hemos pasado por él
    this.showBackToTop = rect.top < window.innerHeight && rect.bottom > 0;
  }

  // Navegación del carrusel de tarjetas
  nextCard() {
    this.nextCardInternal();
    this.startCardAutoplay();
  }

  prevCard() {
    this.cardIndex = (this.cardIndex - 1 + this.toolCards.length) % this.toolCards.length;
    this.startCardAutoplay();
  }

  goToCard(index: number) {
    this.cardIndex = index;
    this.startCardAutoplay();
  }

  private nextCardInternal() {
    this.cardIndex = (this.cardIndex + 1) % this.toolCards.length;
  }
}
