import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { BillingService } from '../../core/services/billing.service';
import { EbookService, Ebook } from '../../core/services/ebook.service';
import { EbookCreationService } from '../../core/services/ebook-creation.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="min-h-screen bg-slate-950 text-white">

      <!-- NAVBAR -->
      <header class="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/90 backdrop-blur-xl">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <!-- Brand -->
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <span class="font-bold text-lg">Pinta<span class="text-indigo-400">Ebook</span></span>
          </div>

          <!-- Right side -->
          <div class="flex items-center gap-4">
            <!-- Credits badge -->
            <div class="flex items-center gap-2 bg-slate-800/60 border border-slate-700/50 rounded-xl px-3 py-1.5">
              <svg class="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clip-rule="evenodd" />
              </svg>
              @if (balanceLoading()) {
                <span class="text-xs text-slate-400">...</span>
              } @else {
                <span class="text-sm font-semibold text-yellow-300">{{ balance() }} créditos</span>
              }
            </div>

            <!-- Comprar créditos (Mercado Pago) -->
            <a
              id="buy-credits-link"
              routerLink="/billing"
              class="text-xs font-semibold text-indigo-300 hover:text-indigo-200 border border-indigo-500/30 hover:border-indigo-400/60 rounded-lg px-3 py-1.5 transition-colors">
              + Comprar créditos
            </a>

            <!-- User email -->
            <span class="text-sm text-slate-400 hidden sm:block">{{ userEmail() }}</span>

            <!-- Logout -->
            <button
              id="logout-btn"
              (click)="logout()"
              class="flex items-center gap-1.5 text-sm text-slate-400 hover:text-red-400 transition-colors duration-200">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Salir
            </button>
          </div>
        </div>
      </header>

      <main class="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        <!-- BUY CREDITS BANNER (lleva a /billing: paquetes + checkout de Mercado Pago) -->
        <section
          id="buy-credits-banner"
          class="bg-gradient-to-r from-indigo-600/20 to-violet-600/20 border border-indigo-500/30 rounded-2xl px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div class="flex items-center gap-4">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shrink-0">
              <svg class="w-5 h-5 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <div>
              <p class="font-semibold text-white text-sm">
                Tenés
                @if (balanceLoading()) { ... } @else { <span class="text-yellow-300">{{ balance() }} créditos</span> }
              </p>
              <p class="text-xs text-slate-400">Comprá más créditos con Mercado Pago para seguir generando e-books.</p>
            </div>
          </div>
          <a
            id="go-to-packages"
            routerLink="/billing"
            class="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-sm px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-500/20 transition-all">
            Ver paquetes de créditos →
          </a>
        </section>

        <!-- GENERATE NEW EBOOK PANEL -->
        <section class="bg-slate-900/60 border border-slate-700/40 rounded-2xl overflow-hidden">
          <button
            id="toggle-create-form"
            (click)="showCreateForm.set(!showCreateForm())"
            class="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-slate-800/30 transition-colors duration-200">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <div>
                <p class="font-semibold text-white text-sm">Generar Nuevo E-book con IA</p>
                <p class="text-xs text-slate-500">Costo: 100 créditos · Powered by AI</p>
              </div>
            </div>
            <svg
              class="w-5 h-5 text-slate-400 transition-transform duration-200"
              [style.transform]="showCreateForm() ? 'rotate(180deg)' : 'rotate(0deg)'"
              fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          @if (showCreateForm()) {
            <div class="px-6 pb-6 border-t border-slate-700/40 pt-5 animate-fade-in">
              @if (createError()) {
                <div class="mb-4 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-red-400 text-sm">
                  {{ createError() }}
                </div>
              }
              <form [formGroup]="createForm" (ngSubmit)="onCreateEbook()" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div class="sm:col-span-2">
                  <label class="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Título del E-book</label>
                  <input
                    id="ebook-title"
                    type="text"
                    formControlName="title"
                    placeholder="Ej: El arte de programar con IA"
                    class="w-full bg-slate-800/50 border border-slate-600/50 text-white placeholder-slate-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" />
                </div>

                <div class="sm:col-span-2">
                  <label class="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Descripción</label>
                  <textarea
                    id="ebook-description"
                    formControlName="description"
                    rows="2"
                    placeholder="Una breve descripción del libro..."
                    class="w-full bg-slate-800/50 border border-slate-600/50 text-white placeholder-slate-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"></textarea>
                </div>

                <div class="sm:col-span-2">
                  <label class="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Idea o Prompt Principal</label>
                  <textarea
                    id="ebook-prompt"
                    formControlName="prompt_idea"
                    rows="3"
                    placeholder="Escribe aquí la idea central que guiará la generación del e-book con IA..."
                    class="w-full bg-slate-800/50 border border-slate-600/50 text-white placeholder-slate-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"></textarea>
                </div>

                <div>
                  <label class="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Cantidad de Capítulos</label>
                  <input
                    id="ebook-chapters"
                    type="number"
                    formControlName="quantity_chapters"
                    min="1"
                    max="20"
                    placeholder="5"
                    class="w-full bg-slate-800/50 border border-slate-600/50 text-white placeholder-slate-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" />
                </div>

                <div class="flex items-end">
                  <button
                    id="create-ebook-submit"
                    type="submit"
                    [disabled]="createLoading() || createForm.invalid"
                    class="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all duration-200 text-sm shadow-lg shadow-emerald-500/20">
                    @if (createLoading()) {
                      <span class="flex items-center justify-center gap-2">
                        <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                        </svg>
                        Generando con IA...
                      </span>
                    } @else {
                      ✨ Generar E-book (100 créditos)
                    }
                  </button>
                </div>
              </form>
            </div>
          }
        </section>

        <!-- EBOOK LIST -->
        <section>
          <div class="flex items-center justify-between mb-5">
            <h2 class="text-lg font-bold text-white">Mis E-books</h2>
            <button
              id="refresh-ebooks"
              (click)="loadEbooks()"
              class="text-xs text-slate-400 hover:text-indigo-400 flex items-center gap-1 transition-colors">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Actualizar
            </button>
          </div>

          @if (listLoading()) {
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              @for (i of [1,2,3]; track i) {
                <div class="bg-slate-900/60 border border-slate-700/40 rounded-2xl p-5 animate-pulse">
                  <div class="h-4 bg-slate-700 rounded w-3/4 mb-3"></div>
                  <div class="h-3 bg-slate-800 rounded w-1/2 mb-5"></div>
                  <div class="flex gap-2">
                    <div class="h-8 bg-slate-700 rounded-lg flex-1"></div>
                    <div class="h-8 bg-slate-700 rounded-lg w-16"></div>
                  </div>
                </div>
              }
            </div>
          } @else if (ebooks().length === 0) {
            <div class="text-center py-16 text-slate-500">
              <svg class="w-12 h-12 mx-auto mb-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <p class="font-medium">Aún no tienes e-books</p>
              <p class="text-sm mt-1">Genera tu primer e-book con IA usando el formulario de arriba</p>
            </div>
          } @else {
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              @for (ebook of ebooks(); track ebook.ebook_id) {
                <div class="group bg-slate-900/60 border border-slate-700/40 hover:border-indigo-500/30 rounded-2xl p-5 transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/5">
                  <div class="flex items-start justify-between mb-3">
                    <div class="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                      <svg class="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <button
                      [id]="'delete-ebook-' + ebook.ebook_id"
                      (click)="onDeleteEbook(ebook.ebook_id)"
                      [disabled]="deletingId() === ebook.ebook_id"
                      class="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-all duration-200 disabled:cursor-not-allowed">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>

                  <h3 class="font-semibold text-white text-sm mb-1 line-clamp-2">{{ ebook.title }}</h3>
                  <p class="text-xs text-slate-500 mb-4">
                    {{ ebook.created_at | date:'dd/MM/yyyy' }}
                  </p>

                  <button
                    [id]="'open-editor-' + ebook.ebook_id"
                    [routerLink]="['/editor', ebook.ebook_id]"
                    class="w-full bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/20 hover:border-indigo-500/40 text-indigo-300 text-xs font-medium py-2 rounded-lg transition-all duration-200">
                    Abrir Editor →
                  </button>
                </div>
              }
            </div>
          }

          @if (listError()) {
            <div class="mt-4 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-red-400 text-sm">
              {{ listError() }}
            </div>
          }
        </section>
      </main>

      <!-- PROGRESS MODAL -->
      @if (showProgressModal()) {
        <div
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="progress-modal-title">
          <div class="w-full max-w-md mx-4 bg-slate-900 border border-slate-700/60 rounded-2xl p-8 shadow-2xl shadow-black/60">

            <!-- Icon -->
            <div class="flex justify-center mb-6">
              <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center animate-pulse">
                <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
            </div>

            <h2 id="progress-modal-title" class="text-xl font-bold text-white text-center mb-2">Generando tu E-book con IA</h2>
            <p class="text-slate-400 text-sm text-center mb-8">{{ progressMessage() }}</p>

            <!-- Progress bar -->
            <div class="mb-3">
              <div class="flex justify-between text-xs text-slate-400 mb-2">
                <span>Progreso</span>
                <span class="font-semibold text-indigo-400">{{ progressPercent() }}%</span>
              </div>
              <div class="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
                <div
                  id="progress-bar"
                  class="h-3 rounded-full bg-gradient-to-r from-indigo-500 to-violet-600 transition-all duration-700 ease-out"
                  [style.width.%]="progressPercent()">
                </div>
              </div>
            </div>

            <!-- Step dots -->
            <div class="flex justify-center gap-2 mt-5">
              @for (step of [1,2,3,4,5]; track step) {
                <div
                  class="w-2 h-2 rounded-full transition-all duration-500"
                  [class]="progressStep() >= step ? 'bg-indigo-500 scale-125' : 'bg-slate-700'">
                </div>
              }
            </div>

            <!-- Error state -->
            @if (progressFailed()) {
              <div class="mt-6 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-red-400 text-sm text-center">
                {{ progressMessage() }}
              </div>
              <button
                id="close-progress-modal"
                (click)="closeProgressModal()"
                class="mt-4 w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition-colors">
                Cerrar
              </button>
            }
          </div>
        </div>
      }
    </div>
  `,
})
export class DashboardComponent implements OnInit, OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly billingService = inject(BillingService);
  private readonly ebookService = inject(EbookService);
  private readonly ebookCreationService = inject(EbookCreationService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private progressSub: Subscription | null = null;

  readonly balance = signal<number>(0);
  readonly balanceLoading = signal(true);
  readonly userEmail = signal('');

  readonly ebooks = signal<Ebook[]>([]);
  readonly listLoading = signal(false);
  readonly listError = signal('');

  readonly showCreateForm = signal(false);
  readonly createLoading = signal(false);
  readonly createError = signal('');

  readonly deletingId = signal<string | null>(null);

  // Progress modal signals
  readonly showProgressModal = signal(false);
  readonly progressPercent = signal(0);
  readonly progressMessage = signal('Iniciando...');
  readonly progressStep = signal(0);
  readonly progressFailed = signal(false);

  readonly createForm: FormGroup = this.fb.group({
    title: ['', Validators.required],
    description: ['', Validators.required],
    prompt_idea: ['', Validators.required],
    quantity_chapters: [5, [Validators.required, Validators.min(1), Validators.max(20)]],
  });

  ngOnInit(): void {
    const user = this.authService.currentUser();
    if (user) this.userEmail.set(user.email);
    this.loadBalance();
    this.loadEbooks();
  }

  loadBalance(): void {
    this.balanceLoading.set(true);
    this.billingService.getBalance().subscribe({
      next: (res) => {
        this.balance.set(res.credits_available);
        this.balanceLoading.set(false);
      },
      error: () => this.balanceLoading.set(false),
    });
  }

  loadEbooks(): void {
    this.listLoading.set(true);
    this.listError.set('');
    this.ebookService.listEbooks().subscribe({
      next: (res) => {
        this.ebooks.set(res.results);
        this.listLoading.set(false);
      },
      error: (err) => {
        this.listError.set(err?.error?.detail || 'Error al cargar los e-books');
        this.listLoading.set(false);
      },
    });
  }

  onCreateEbook(): void {
    if (this.createForm.invalid) return;
    this.createLoading.set(true);
    this.createError.set('');

    // Step 1: fast REST call — returns 201 + ebook_id almost instantly
    this.ebookCreationService.createEbook(this.createForm.value).subscribe({
      next: (res) => {
        this.createLoading.set(false);
        this.showCreateForm.set(false);
        this.createForm.reset({ quantity_chapters: 5 });

        // Open progress modal
        this.progressPercent.set(0);
        this.progressStep.set(0);
        this.progressMessage.set('Conectando al canal de progreso...');
        this.progressFailed.set(false);
        this.showProgressModal.set(true);

        // Step 2: connect WebSocket and stream progress events
        const token = localStorage.getItem('access_token') ?? '';
        this.progressSub = this.ebookCreationService
          .connectToProgress(res.ebook_id, token)
          .subscribe({
            next: (event) => {
              this.progressPercent.set(event.progress);
              this.progressMessage.set(event.message);
              this.progressStep.set(event.step);

              if (event.status === 'COMPLETED') {
                // Update credits if provided
                if (event.credits_available !== undefined) {
                  this.balance.set(event.credits_available);
                }
                // Add a provisional ebook card (list will refresh on navigate)
                this.ebooks.update((list) => [
                  {
                    ebook_id: res.ebook_id,
                    title: res.title,
                    description: res.description,
                    prompt_idea: '',
                    quantity_chapters: 0,
                    status: 'COMPLETED',
                    created_at: res.created_at,
                    updated_at: res.updated_at,
                    credits_available: event.credits_available ?? 0,
                  },
                  ...list,
                ]);
                // Short pause so the user sees 100% before navigating
                setTimeout(() => {
                  this.showProgressModal.set(false);
                  this.router.navigate(['/editor', res.ebook_id]);
                }, 800);
              }

              if (event.status === 'FAILED') {
                this.progressFailed.set(true);
                this.loadBalance();
              }
            },
            error: (err) => {
              console.error('[WS] Progress error:', err);
              this.progressFailed.set(true);
              this.progressMessage.set(
                err?.message ?? 'Error de conexión con el servidor'
              );
            },
          });
      },
      error: (err) => {
        this.createLoading.set(false);
        this.createError.set(
          err?.error?.detail ?? 'Error al iniciar la generación del e-book'
        );
      },
    });
  }

  onDeleteEbook(id: string): void {
    if (!confirm('¿Eliminar este e-book? Esta acción no se puede deshacer.')) return;
    this.deletingId.set(id);
    this.ebookService.deleteEbook(id).subscribe({
      next: () => {
        this.ebooks.update((list) => list.filter((e) => e.ebook_id !== id));
        this.deletingId.set(null);
      },
      error: () => this.deletingId.set(null),
    });
  }

  closeProgressModal(): void {
    this.showProgressModal.set(false);
    this.ebookCreationService.disconnect();
    this.progressSub?.unsubscribe();
    this.progressSub = null;
  }

  ngOnDestroy(): void {
    this.progressSub?.unsubscribe();
    this.ebookCreationService.disconnect();
  }

  logout(): void {
    this.authService.logout();
  }
}
