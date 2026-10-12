import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import {
  BillingService,
  CreditPackage,
} from '../../core/services/billing.service';

/** Clave de sessionStorage con el saldo previo a pagar (lo lee la pantalla de resultado). */
export const BALANCE_BEFORE_KEY = 'balance_before_checkout';

/**
 * Pantalla "Comprar créditos".
 *
 * Flujo (ver documentacion-guia/workflow_billing_guia_actual.md):
 *  1. GET  /api/billing/packages/  -> lista de paquetes
 *  2. POST /api/billing/checkout/  -> { init_point }
 *  3. window.location.href = init_point  (el usuario paga en Mercado Pago)
 */
@Component({
  selector: 'app-packages',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="min-h-screen bg-slate-950 text-white">
      <header class="border-b border-slate-800 bg-slate-950/90">
        <div class="max-w-5xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <a routerLink="/dashboard" class="text-sm text-slate-400 hover:text-indigo-400 transition-colors">
            ← Volver al dashboard
          </a>
          <div class="flex items-center gap-2 bg-slate-800/60 border border-slate-700/50 rounded-xl px-3 py-1.5">
            <span class="text-xs text-slate-400">Saldo actual</span>
            @if (balance() === null) {
              <span class="text-sm text-slate-500">...</span>
            } @else {
              <span id="current-balance" class="text-sm font-semibold text-yellow-300">{{ balance() }} créditos</span>
            }
          </div>
        </div>
      </header>

      <main class="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <h1 class="text-2xl font-bold">Comprar créditos</h1>
        <p class="text-slate-400 text-sm mt-1">
          Elegí un paquete. Vas a pagar en Mercado Pago y, al terminar, tus créditos se acreditan automáticamente.
        </p>

        <!-- Aviso de modo prueba -->
        <div class="mt-5 rounded-xl bg-amber-500/10 border border-amber-500/20 px-4 py-3 text-amber-300 text-xs">
          <strong>Modo prueba:</strong> los pagos son ficticios. En Mercado Pago iniciá sesión con el
          <strong>usuario comprador de prueba</strong> (nunca con tu cuenta real) y pagá con una tarjeta de prueba.
          Detalle en la guía de billing.
        </div>

        @if (error()) {
          <div id="billing-error" class="mt-5 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-red-400 text-sm">
            {{ error() }}
          </div>
        }

        @if (loading()) {
          <div class="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
            @for (i of [1, 2, 3]; track i) {
              <div class="bg-slate-900/60 border border-slate-700/40 rounded-2xl p-6 animate-pulse h-48"></div>
            }
          </div>
        } @else {
          <div class="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
            @for (pkg of packages(); track pkg.id) {
              <div class="bg-slate-900/60 border border-slate-700/40 hover:border-indigo-500/40 rounded-2xl p-6 flex flex-col transition-all">
                <h2 class="font-semibold text-lg">{{ pkg.nombre }}</h2>
                <p class="mt-3 text-3xl font-bold text-yellow-300">{{ pkg.cantidad_creditos }}</p>
                <p class="text-xs text-slate-500">créditos</p>
                <p class="mt-4 text-xl font-semibold">{{ formatPrice(pkg.precio) }}</p>

                <button
                  [id]="'buy-package-' + pkg.id"
                  (click)="buy(pkg)"
                  [disabled]="buyingId() !== null"
                  class="mt-6 w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl text-sm transition-all">
                  @if (buyingId() === pkg.id) {
                    Redirigiendo a Mercado Pago...
                  } @else {
                    Comprar
                  }
                </button>
              </div>
            } @empty {
              <p class="text-slate-500 text-sm sm:col-span-3">No hay paquetes disponibles.</p>
            }
          </div>
        }
      </main>
    </div>
  `,
})
export class PackagesComponent implements OnInit {
  private readonly billing = inject(BillingService);

  readonly packages = signal<CreditPackage[]>([]);
  readonly balance = signal<number | null>(null);
  readonly loading = signal(true);
  readonly error = signal('');
  /** id del paquete en compra; sirve para deshabilitar TODOS los botones (evita doble clic). */
  readonly buyingId = signal<number | null>(null);

  ngOnInit(): void {
    this.billing.getBalance().subscribe({
      next: (b) => this.balance.set(b.credits_available),
    });

    this.billing.getPackages().subscribe({
      next: (list) => {
        this.packages.set(list);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No pudimos cargar los paquetes. Intentá de nuevo.');
        this.loading.set(false);
      },
    });
  }

  buy(pkg: CreditPackage): void {
    if (this.buyingId() !== null) return;
    this.buyingId.set(pkg.id);
    this.error.set('');

    // Guardamos el saldo actual: la pantalla de resultado lo compara para
    // saber si los créditos ya se acreditaron.
    try {
      sessionStorage.setItem(BALANCE_BEFORE_KEY, String(this.balance() ?? 0));
    } catch {
      /* sessionStorage no disponible: la pantalla de resultado funciona igual */
    }

    this.billing.createCheckout(pkg.id).subscribe({
      next: ({ init_point }) => {
        // Navegación completa a Mercado Pago (no es una llamada HTTP más).
        window.location.href = init_point;
      },
      error: (err: HttpErrorResponse) => {
        this.buyingId.set(null);
        this.error.set(this.describeError(err));
      },
    });
  }

  /** Se decide por el código HTTP, no por el texto del mensaje. */
  private describeError(err: HttpErrorResponse): string {
    switch (err.status) {
      case 400:
        return 'El paquete seleccionado no se puede comprar.';
      case 401:
        return 'Tu sesión venció. Volvé a iniciar sesión.';
      case 404:
        return 'El paquete ya no existe. Recargá la página.';
      case 502:
      case 503:
        return 'Mercado Pago no está disponible en este momento. Intentá de nuevo en unos minutos.';
      default:
        return 'No pudimos iniciar el pago. Intentá de nuevo.';
    }
  }

  formatPrice(precio: string): string {
    return Number(precio).toLocaleString('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0,
    });
  }
}
