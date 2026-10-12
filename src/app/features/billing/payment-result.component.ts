import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { catchError, of, Subscription, switchMap, take, timer } from 'rxjs';
import { BillingService } from '../../core/services/billing.service';
import { BALANCE_BEFORE_KEY } from './packages.component';

type ResultState = 'checking' | 'credited' | 'processing' | 'pending' | 'failure';

const POLL_EVERY_MS = 3000;
const MAX_ATTEMPTS = 10; // ~30 segundos

/**
 * Pantalla a la que Mercado Pago devuelve al usuario (back_urls):
 *   /billing/result/success | /billing/result/pending | /billing/result/failure
 *
 * IMPORTANTE: no se confía en los parámetros de la URL (status=approved...),
 * cualquiera puede escribirlos a mano. La única fuente de verdad es el saldo
 * que devuelve el backend, porque la acreditación la hace el webhook.
 * Por eso, en "success" se consulta el saldo hasta que aumente.
 */
@Component({
  selector: 'app-payment-result',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
      <div class="w-full max-w-md bg-slate-900/80 border border-slate-700/50 rounded-2xl p-8 text-center">
        @switch (state()) {
          @case ('checking') {
            <div class="text-4xl mb-4">⏳</div>
            <h1 id="result-title" class="text-xl font-bold">Confirmando tu pago...</h1>
            <p class="text-slate-400 text-sm mt-2">
              Estamos esperando la confirmación de Mercado Pago. Esto puede tardar unos segundos.
            </p>
            <p class="text-slate-500 text-xs mt-4">Intento {{ attempt() }} de {{ MAX }}</p>
          }
          @case ('credited') {
            <div class="text-4xl mb-4">✅</div>
            <h1 id="result-title" class="text-xl font-bold text-emerald-400">¡Créditos acreditados!</h1>
            <p class="text-slate-300 text-sm mt-2">
              Tu saldo ahora es de <strong id="new-balance" class="text-yellow-300">{{ balance() }} créditos</strong>.
            </p>
          }
          @case ('processing') {
            <div class="text-4xl mb-4">🕒</div>
            <h1 id="result-title" class="text-xl font-bold text-amber-300">Tu pago se está procesando</h1>
            <p class="text-slate-400 text-sm mt-2">
              Todavía no vemos los créditos, pero no es un error: la confirmación puede tardar unos minutos.
              Revisá tu saldo en un rato.
            </p>
          }
          @case ('pending') {
            <div class="text-4xl mb-4">🕒</div>
            <h1 id="result-title" class="text-xl font-bold text-amber-300">Pago pendiente</h1>
            <p class="text-slate-400 text-sm mt-2">
              Tu pago quedó pendiente de confirmación. Los créditos se acreditarán cuando Mercado Pago lo apruebe.
            </p>
          }
          @case ('failure') {
            <div class="text-4xl mb-4">❌</div>
            <h1 id="result-title" class="text-xl font-bold text-red-400">El pago no se completó</h1>
            <p class="text-slate-400 text-sm mt-2">No se te cobró nada. Podés intentarlo de nuevo.</p>
          }
        }

        <div class="mt-8 flex flex-col gap-3">
          @if (state() === 'failure' || state() === 'processing' || state() === 'pending') {
            <a routerLink="/billing" class="bg-indigo-600 hover:bg-indigo-500 py-3 rounded-xl text-sm font-semibold transition-colors">
              Volver a los paquetes
            </a>
          }
          <a routerLink="/dashboard" class="text-sm text-slate-400 hover:text-indigo-400 transition-colors">
            Ir al dashboard
          </a>
        </div>
      </div>
    </div>
  `,
})
export class PaymentResultComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly billing = inject(BillingService);
  private pollSub: Subscription | null = null;

  readonly state = signal<ResultState>('checking');
  readonly balance = signal<number | null>(null);
  readonly attempt = signal(0);
  readonly MAX = MAX_ATTEMPTS;

  ngOnInit(): void {
    // El segmento de la ruta (success/pending/failure) lo definen las back_urls del backend.
    const outcome = this.route.snapshot.paramMap.get('outcome');

    if (outcome === 'failure') {
      this.state.set('failure');
      return;
    }
    if (outcome === 'pending') {
      this.state.set('pending');
      return;
    }

    this.waitForCredits();
  }

  /** Consulta el saldo cada 3 s (máx. ~30 s) hasta que supere el saldo previo a pagar. */
  private waitForCredits(): void {
    const before = this.readBalanceBefore();

    this.pollSub = timer(0, POLL_EVERY_MS)
      .pipe(
        take(MAX_ATTEMPTS),
        switchMap((i) => {
          this.attempt.set(i + 1);
          return this.billing.getBalance().pipe(catchError(() => of(null)));
        }),
      )
      .subscribe({
        next: (b) => {
          if (!b) return;
          this.balance.set(b.credits_available);
          if (before !== null && b.credits_available > before) {
            this.state.set('credited');
            this.pollSub?.unsubscribe();
          }
        },
        complete: () => {
          if (this.state() === 'checking') this.state.set('processing');
        },
      });
  }

  private readBalanceBefore(): number | null {
    try {
      const raw = sessionStorage.getItem(BALANCE_BEFORE_KEY);
      return raw === null ? null : Number(raw);
    } catch {
      return null;
    }
  }

  ngOnDestroy(): void {
    this.pollSub?.unsubscribe();
  }
}
