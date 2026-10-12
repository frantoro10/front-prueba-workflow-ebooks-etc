import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../../environments/environment';

/** Shape of every progress frame the WebSocket emits */
export interface ProgressEvent {
  type: 'progress_update';
  step: number;
  progress: number;
  message: string;
  status?: 'PROCESSING' | 'COMPLETED' | 'FAILED';
  credits_available?: number;
  error?: string;
}

/** Immediate HTTP 201 response from POST /api/ebooks/ */
export interface CreateEbookResponse {
  ebook_id: string;
  title: string;
  description: string;
  status: 'PROCESSING';
  created_at: string;
  updated_at: string;
}

export interface CreateEbookPayload {
  title: string;
  description: string;
  prompt_idea: string;
  quantity_chapters: number;
}

@Injectable({ providedIn: 'root' })
export class EbookCreationService {
  private readonly http = inject(HttpClient);
  private readonly BASE_HTTP = environment.apiUrl;
  // El host del WebSocket se deriva de la misma URL de la API.
  private readonly BASE_WS = new URL(environment.apiUrl).host;

  private socket: WebSocket | null = null;
  private progressSubject: Subject<ProgressEvent> | null = null;

  /**
   * Step 1 — Fast REST call.
   * Returns 201 almost instantly with { ebook_id, status: "PROCESSING" }.
   */
  createEbook(payload: CreateEbookPayload): Observable<CreateEbookResponse> {
    return this.http.post<CreateEbookResponse>(
      `${this.BASE_HTTP}/ebooks/`,
      payload
    );
  }

  /**
   * Step 2 — Open WebSocket and return an Observable of progress events.
   *
   * The caller just subscribes; no need to send anything back through the socket.
   * The observable completes when status is COMPLETED or FAILED, and the
   * underlying WebSocket is closed automatically.
   *
   * @param ebookId  UUID returned by the REST call
   * @param token    JWT access_token stored in localStorage
   */
  connectToProgress(
    ebookId: string,
    token: string
  ): Observable<ProgressEvent> {
    // Clean up any lingering socket before opening a new one
    this.disconnect();

    this.progressSubject = new Subject<ProgressEvent>();

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const url = `${protocol}//${this.BASE_WS}/ws/ebooks/${ebookId}/progress/?token=${token}`;

    this.socket = new WebSocket(url);

    this.socket.onopen = () => {
      console.log('[WS] Connected to progress channel for ebook:', ebookId);
    };

    this.socket.onmessage = (event: MessageEvent) => {
      try {
        const data: ProgressEvent = JSON.parse(event.data as string);
        this.progressSubject!.next(data);

        // Terminal states → close the socket and complete the Observable
        if (data.status === 'COMPLETED' || data.status === 'FAILED') {
          this.disconnect();
        }
      } catch (e) {
        console.error('[WS] Failed to parse message:', e);
      }
    };

    this.socket.onerror = (err: Event) => {
      console.error('[WS] Socket error:', err);
      this.progressSubject!.error(err);
      this.disconnect();
    };

    this.socket.onclose = (event: CloseEvent) => {
      console.log(`[WS] Socket closed. Code: ${event.code}`);

      if (!this.progressSubject || this.progressSubject.closed) return;

      // Codes 4001 / 4003 are auth errors defined by the backend
      if (event.code === 4001 || event.code === 4003) {
        this.progressSubject.error(
          new Error(`Error de autenticación WebSocket (código ${event.code})`)
        );
        return;
      }

      // Code 1011 = Internal Server Error from the server (e.g. Redis timeout)
      if (event.code === 1011) {
        this.progressSubject.error(
          new Error('El servidor cerró la conexión inesperadamente. Intenta nuevamente.')
        );
        return;
      }

      // Normal close (1000) or any other code: complete normally
      this.progressSubject.complete();
    };

    return this.progressSubject.asObservable();
  }

  /** Cleanly tear down socket + subject */
  disconnect(): void {
    if (this.socket) {
      if (
        this.socket.readyState === WebSocket.OPEN ||
        this.socket.readyState === WebSocket.CONNECTING
      ) {
        this.socket.close();
      }
      this.socket = null;
    }

    if (this.progressSubject && !this.progressSubject.closed) {
      this.progressSubject.complete();
    }
    this.progressSubject = null;
  }
}
