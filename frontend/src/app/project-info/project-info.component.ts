import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-project-info',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './project-info.component.html',
  styleUrls: ['./project-info.component.css']
})
export class ProjectInfoComponent {
  
  projectFeatures = [
    {
      icon: 'device_thermostat',
      color: 'var(--color-primary)',
      title: 'Monitoreo Ambiental',
      description: 'Control en tiempo real de temperatura, humedad y presión atmosférica'
    },
    {
      icon: 'sensors',
      color: 'var(--color-secondary)',
      title: 'Tecnología IoT',
      description: 'Sistema inteligente conectado para gestión remota de sensores'
    },
    {
      icon: 'developer_board',
      color: 'var(--color-primary)',
      title: 'ESP32',
      description: 'Microcontrolador para procesamiento eficiente'
    },
    {
      icon: 'analytics',
      color: 'var(--color-secondary)',
      title: 'Análisis de Datos',
      description: 'Recopilación y análisis de información ambiental'
    }
  ];

  dataPoints = [
    { value: '25°C', label: 'Temperatura' },
    { value: '65%', label: 'Humedad' },
    { value: '1013', label: 'Presión' },
    { value: '45', label: 'Calidad Aire' }
  ];

  scrollToCarousel() {
    const carousel = document.querySelector('app-carousel');
    if (carousel) {
      carousel.scrollIntoView({ behavior: 'smooth' });
    }
  }
}
