import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { tap, map, shareReplay } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface SensorReading {
  id: number;
  usuario_id: number;
  usuario_nombre: string;
  sensor_id: string;
  sensor_nombre: string;
  valor: number;
  fecha_lectura: string;
  estado: 'Bueno' | 'Advertencia' | 'Malo';
  created_at: string;
  updated_at: string;
}

export interface Statistics {
  total: number;
  buenos: number;
  advertencias: number;
  malos: number;
}

@Injectable({
  providedIn: 'root'
})
export class AdminDataService {
  private apiUrl = environment.apiBaseUrl;
  private isBrowser: boolean;
  
  // Caché de datos
  private dataCache$ = new BehaviorSubject<SensorReading[]>([]);
  private statisticsCache$ = new BehaviorSubject<Statistics>({
    total: 0,
    buenos: 0,
    advertencias: 0,
    malos: 0
  });
  private lastLoadTime = 0;
  private cacheExpiry = 5 * 60 * 1000; // 5 minutos
  
  // Observables públicos
  public data$ = this.dataCache$.asObservable();
  public statistics$ = this.statisticsCache$.asObservable();
  
  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }
  
  private getHeaders(): HttpHeaders {
    const token = this.isBrowser ? localStorage.getItem('token') : null;
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }
  
  /**
   * Carga datos con caché inteligente
   * Solo recarga si han pasado más de 5 minutos o si se fuerza
   */
  loadData(forceReload = false): Observable<SensorReading[]> {
    const now = Date.now();
    const cacheIsValid = (now - this.lastLoadTime) < this.cacheExpiry;
    const hasData = this.dataCache$.value.length > 0;
    
    // Si el caché es válido y no se fuerza recarga, devolver datos en caché
    if (!forceReload && cacheIsValid && hasData) {
      console.log('✅ Usando datos en caché');
      return of(this.dataCache$.value);
    }
    
    console.log('🔄 Cargando datos desde el servidor...');
    
    // Reducir el límite a 500 para mejorar rendimiento
    return this.http.get<any>(`${this.apiUrl}/lecturas/admin?limit=500`, {
      headers: this.getHeaders()
    }).pipe(
      map(data => this.processData(data)),
      tap(processedData => {
        this.dataCache$.next(processedData);
        this.lastLoadTime = now;
        this.calculateStatistics(processedData);
        console.log('✅ Datos cargados y cacheados:', processedData.length);
      }),
      shareReplay(1) // Compartir la misma petición entre múltiples suscriptores
    );
  }
  
  /**
   * Procesa los datos del servidor
   */
  private processData(data: any): SensorReading[] {
    let allData: SensorReading[] = [];
    
    // Procesar MQ-135
    if (data.mq135 && data.mq135.length > 0) {
      const mq135Data = data.mq135.map((item: any) => this.mapToSensorReading(item, 'mq135', 'MQ-135 (Calidad del aire)'));
      allData = allData.concat(mq135Data);
    }
    
    // Procesar MQ-4
    if (data.mq4 && data.mq4.length > 0) {
      const mq4Data = data.mq4.map((item: any) => this.mapToSensorReading(item, 'mq4', 'MQ-4 (Gas metano)'));
      allData = allData.concat(mq4Data);
    }
    
    // Procesar MQ-7
    if (data.mq7 && data.mq7.length > 0) {
      const mq7Data = data.mq7.map((item: any) => this.mapToSensorReading(item, 'mq7', 'MQ-7 (Monóxido de carbono)'));
      allData = allData.concat(mq7Data);
    }
    
    // Ordenar por fecha más reciente
    allData.sort((a, b) => new Date(b.fecha_lectura).getTime() - new Date(a.fecha_lectura).getTime());
    
    return allData;
  }
  
  /**
   * Mapea un item a SensorReading
   */
  private mapToSensorReading(item: any, sensorId: string, sensorNombre: string): SensorReading {
    return {
      id: item.id,
      usuario_id: item.usuario_id,
      usuario_nombre: item.usuario_nombre || 'Usuario',
      sensor_id: sensorId,
      sensor_nombre: sensorNombre,
      valor: item.valor,
      fecha_lectura: item.fecha_lectura,
      estado: this.determinarEstado(item.valor, sensorId),
      created_at: item.creado_en,
      updated_at: item.creado_en
    };
  }
  
  /**
   * Determina el estado basado en el valor y sensor
   */
  private determinarEstado(valor: number, sensorId: string): 'Bueno' | 'Advertencia' | 'Malo' {
    switch (sensorId) {
      case 'mq135':
        return valor < 400 ? 'Bueno' : (valor < 1000 ? 'Advertencia' : 'Malo');
      case 'mq4':
        return valor < 1000 ? 'Bueno' : (valor < 5000 ? 'Advertencia' : 'Malo');
      case 'mq7':
        return valor < 9 ? 'Bueno' : (valor < 35 ? 'Advertencia' : 'Malo');
      default:
        return 'Bueno';
    }
  }
  
  /**
   * Calcula estadísticas
   */
  private calculateStatistics(data: SensorReading[]): void {
    const stats: Statistics = {
      total: data.length,
      buenos: data.filter(item => item.estado === 'Bueno').length,
      advertencias: data.filter(item => item.estado === 'Advertencia').length,
      malos: data.filter(item => item.estado === 'Malo').length
    };
    this.statisticsCache$.next(stats);
  }
  
  /**
   * Actualiza una lectura
   */
  updateReading(sensorId: string, id: number, valor: number, fecha_lectura: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/lecturas/${sensorId}/${id}`, {
      valor,
      fecha_lectura
    }, {
      headers: this.getHeaders()
    }).pipe(
      tap(() => {
        // Invalidar caché después de actualizar
        this.invalidateCache();
      })
    );
  }
  
  /**
   * Elimina una lectura
   */
  deleteReading(sensorIdNumber: number, id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/lecturas/${sensorIdNumber}/${id}`, {
      headers: this.getHeaders()
    }).pipe(
      tap(() => {
        // Invalidar caché después de eliminar
        this.invalidateCache();
      })
    );
  }
  
  /**
   * Invalida el caché y fuerza recarga en la próxima petición
   */
  invalidateCache(): void {
    this.lastLoadTime = 0;
    console.log('🗑️ Caché invalidado');
  }
  
  /**
   * Limpia completamente el caché
   */
  clearCache(): void {
    this.dataCache$.next([]);
    this.statisticsCache$.next({
      total: 0,
      buenos: 0,
      advertencias: 0,
      malos: 0
    });
    this.lastLoadTime = 0;
    console.log('🗑️ Caché limpiado');
  }
  
  /**
   * Obtiene datos actuales del caché sin hacer petición
   */
  getCachedData(): SensorReading[] {
    return this.dataCache$.value;
  }
  
  /**
   * Verifica si el caché está disponible
   */
  hasCachedData(): boolean {
    return this.dataCache$.value.length > 0;
  }
}