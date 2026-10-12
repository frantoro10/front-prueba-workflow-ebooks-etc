import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

/** GET /api/billing/balance/ */
export interface Balance {
  credits_available: number;
  last_updated: string;
}

/**
 * GET /api/billing/packages/
 * `precio` llega como STRING ("1000.00"): DRF serializa los Decimal así para
 * no perder precisión. Convertir con Number() solo para mostrarlo.
 */
export interface CreditPackage {
  id: number;
  nombre: string;
  cantidad_creditos: number;
  precio: string;
}

/** POST /api/billing/checkout/ (201) */
export interface CheckoutResponse {
  init_point: string;
}

@Injectable({ providedIn: 'root' })
export class BillingService {
  private readonly http = inject(HttpClient);
  private readonly BASE = `${environment.apiUrl}/billing`;

  /** Saldo de créditos del usuario autenticado. */
  getBalance(): Observable<Balance> {
    return this.http.get<Balance>(`${this.BASE}/balance/`);
  }

  /** Catálogo de paquetes de créditos (ordenado por precio). */
  getPackages(): Observable<CreditPackage[]> {
    return this.http.get<CreditPackage[]>(`${this.BASE}/packages/`);
  }

  /**
   * Inicia el pago de un paquete. El backend responde con la URL de pago de
   * Mercado Pago (`init_point`); el front debe redirigir a ella con
   * `window.location.href`. Solo se envía el id: el precio lo decide el backend.
   */
  createCheckout(paqueteId: number): Observable<CheckoutResponse> {
    return this.http.post<CheckoutResponse>(`${this.BASE}/checkout/`, {
      paquete_id: paqueteId,
    });
  }
}
