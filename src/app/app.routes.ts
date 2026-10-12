import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: 'auth',
    loadComponent: () =>
      import('./features/auth/auth.component').then((m) => m.AuthComponent),
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then(
        (m) => m.DashboardComponent
      ),
    canActivate: [authGuard],
  },
  {
    // Catálogo de paquetes + botón "Comprar" (inicia el checkout de Mercado Pago)
    path: 'billing',
    loadComponent: () =>
      import('./features/billing/packages.component').then(
        (m) => m.PackagesComponent
      ),
    canActivate: [authGuard],
  },
  {
    // A donde Mercado Pago devuelve al usuario: success | pending | failure
    path: 'billing/result/:outcome',
    loadComponent: () =>
      import('./features/billing/payment-result.component').then(
        (m) => m.PaymentResultComponent
      ),
    canActivate: [authGuard],
  },
  {
    path: 'editor/:id',
    loadComponent: () =>
      import('./features/editor/editor.component').then(
        (m) => m.EditorComponent
      ),
    canActivate: [authGuard],
  },
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];
