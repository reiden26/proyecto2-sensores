import { Routes } from '@angular/router';
import { AdminPageComponent } from './admin-page/admin-page.component';
import { UserPageComponent } from './user-page/user-page.component';
import { UserDashboardComponent } from './user-page/user-dashboard.component';
import { AccessDeniedComponent } from './access-denied/access-denied.component';
import { DataTableComponent } from './data-table/data-table.component';
import { UserDataPageComponent } from './user-page/user-data-page.component';
import { RoleGuard } from './role.guard';
import { CanMatchFn, Router } from '@angular/router';
import { inject } from '@angular/core';

const roleMatch = (role: 'admin' | 'usuario'): CanMatchFn => (route, segments) => {
  const router = inject(Router);
  if (typeof localStorage === 'undefined') return router.createUrlTree(['/access-denied']);
  const token = localStorage.getItem('token');
  if (!token) return router.createUrlTree(['/access-denied']);
  try {
    const payload = JSON.parse(atob(token.split('.')[1] || ''));
    const now = Math.floor(Date.now() / 1000);
    if (!payload?.exp || payload.exp <= now) return router.createUrlTree(['/access-denied']);
    return (payload?.rol || '').toLowerCase() === role ? true : router.createUrlTree(['/access-denied']);
  } catch {
    return router.createUrlTree(['/access-denied']);
  }
};
import { UserSensorsComponent } from './user-page/user-sensors.component';
import { AdminUsersComponent } from './admin-users/admin-users.component';
import { AdminDashboardComponent } from './admin-page/admin-dashboard.component';
import { AdminDashboardPanelComponent } from './admin-page/admin-dashboard-panel.component';
import { AdminReportsComponent } from './admin-page/admin-reports.component';
import { AdminDataComponent } from './admin-page/admin-data.component';
import { UserSettingsComponent } from './user-settings/user-settings.component';
import { UserReportsComponent } from './user-page/user-reports.component';
import { LandingComponent } from './landing.component';

export const routes: Routes = [
  {
    path: '',
    component: LandingComponent,
    pathMatch: 'full'
  },
  {
    path: 'admin',
    component: AdminDashboardComponent,
    canMatch: [roleMatch('admin')],
    data: { role: 'admin' },
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        component: AdminDashboardPanelComponent
      },
      {
        path: 'datos',
        component: AdminDataComponent
      },
      {
        path: 'usuarios',
        component: AdminUsersComponent
      },
      {
        path: 'reportes',
        component: AdminReportsComponent
      },
      {
        path: 'configuracion',
        component: UserSettingsComponent
      }
    ]
  },
  {
    path: 'usuario',
    component: UserPageComponent,
    canMatch: [roleMatch('usuario')],
    data: { role: 'usuario' },
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        component: UserDashboardComponent
      },
      {
        path: 'sensores',
        component: UserSensorsComponent
      },
      {
        path: 'datos',
        component: UserDataPageComponent
      },
      {
        path: 'reportes',
        component: UserReportsComponent
      },
      {
        path: 'configuracion',
        component: UserSettingsComponent
      }
    ]
  },
  {
    path: 'access-denied',
    component: AccessDeniedComponent
  }
];
