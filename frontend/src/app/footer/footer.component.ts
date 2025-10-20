import { Component, OnInit, OnDestroy, HostBinding } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../services/theme.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.css']
})
export class FooterComponent implements OnInit, OnDestroy {
  isDarkTheme: boolean = true;
  private themeSubscription: Subscription = new Subscription();

  @HostBinding('class.light-theme') get lightTheme() {
    return !this.isDarkTheme;
  }

  constructor(private themeService: ThemeService) {}

  ngOnInit(): void {
    // Suscribirse a cambios de tema
    this.themeSubscription = this.themeService.isDarkTheme$.subscribe(
      isDark => this.isDarkTheme = isDark
    );
  }

  ngOnDestroy(): void {
    this.themeSubscription.unsubscribe();
  }
}
