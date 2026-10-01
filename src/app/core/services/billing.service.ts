import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Balance {
  credits_available: number;
  last_updated: string;
}

@Injectable({ providedIn: 'root' })
export class BillingService {
  private readonly http = inject(HttpClient);
  private readonly BASE = 'http://localhost:8000/api/billing';

  getBalance(): Observable<Balance> {
    return this.http.get<Balance>(`${this.BASE}/balance/`);
  }
}
