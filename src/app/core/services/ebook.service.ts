import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Ebook {
  ebook_id: string;
  title: string;
  description: string;
  prompt_idea: string;
  quantity_chapters: number;
  status?: 'PROCESSING' | 'COMPLETED' | 'FAILED';
  created_at: string;
  updated_at: string;
  credits_available: number;
}

export interface EbookListResponse {
  results: Ebook[];
  count: number;
  next: string | null;
  previous: string | null;
}

export interface CreateEbookPayload {
  title: string;
  description?: string;
  prompt_idea: string;
  quantity_chapters: number;
}

export interface Section {
  id: string;
  title: string;
  html: string;
}

export interface Chapter {
  id: string;
  title: string;
  sections: Section[];
}

export interface EbookContent {
  ebook_id: string;
  chapters: Chapter[];
}

export interface PatchSectionPayload {
  sections: { chapter_id: string; section_id: string; html: string }[];
}

export interface AiGeneratePayload {
  ebook_id: string;
  chapter_id: string;
  section_id: string;
  prompt: string;
}

export interface AiGenerateResponse {
  generated_html: string;       // campo real del backend: /api/ai/generate/
  credits_available?: number;   // campo real del backend
  // legacy aliases mantenidos por si el backend cambia
  html?: string;
  credits_remaining?: number;
}

@Injectable({ providedIn: 'root' })
export class EbookService {
  private readonly http = inject(HttpClient);
  private readonly BASE = environment.apiUrl;

  listEbooks(): Observable<EbookListResponse> {
    return this.http.get<EbookListResponse>(`${this.BASE}/ebooks/`);
  }

  createEbook(payload: CreateEbookPayload): Observable<Ebook> {
    return this.http.post<Ebook>(`${this.BASE}/ebooks/`, payload);
  }

  deleteEbook(id: string): Observable<void> {
    return this.http.delete<void>(`${this.BASE}/ebooks/${id}/`);
  }

  getEbookContent(id: string): Observable<EbookContent> {
    return this.http.get<EbookContent>(`${this.BASE}/ebooks/${id}/content/`);
  }

  patchEbookContent(
    id: string,
    payload: PatchSectionPayload
  ): Observable<unknown> {
    return this.http.patch(`${this.BASE}/ebooks/${id}/content/`, payload);
  }

  generateWithAi(payload: AiGeneratePayload): Observable<AiGenerateResponse> {
    return this.http.post<AiGenerateResponse>(
      `${this.BASE}/ai/generate/`,
      payload
    );
  }
}
