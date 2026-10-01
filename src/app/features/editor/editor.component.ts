import {
  Component,
  inject,
  OnInit,
  OnDestroy,
  signal,
  ElementRef,
  ViewChild,
  AfterViewInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import {
  EbookService,
  EbookContent,
  Chapter,
  Section,
} from '../../core/services/ebook.service';
import { BillingService } from '../../core/services/billing.service';

@Component({
  selector: 'app-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  styles: [`
    /* ── Estilos del área de edición rich-text ── */
    .rich-editor {
      outline: none;
      min-height: 400px;
      color: #e2e8f0;
      line-height: 1.75;
    }
    .rich-editor h1, .rich-editor h2, .rich-editor h3,
    .rich-editor h4, .rich-editor h5, .rich-editor h6 {
      font-weight: 700;
      color: #f1f5f9;
      margin-bottom: .5rem;
      margin-top: 1.25rem;
      line-height: 1.3;
    }
    .rich-editor h1 { font-size: 1.6rem; border-bottom: 1px solid #334155; padding-bottom: .35rem; }
    .rich-editor h2 { font-size: 1.3rem; }
    .rich-editor h3 { font-size: 1.1rem; color: #a5b4fc; }
    .rich-editor p  { margin-bottom: .85rem; }
    .rich-editor ul, .rich-editor ol { padding-left: 1.5rem; margin-bottom: .85rem; }
    .rich-editor li { margin-bottom: .3rem; }
    .rich-editor strong, .rich-editor b { color: #c7d2fe; font-weight: 700; }
    .rich-editor em, .rich-editor i   { color: #a5b4fc; font-style: italic; }
    .rich-editor code {
      background: #1e293b; border: 1px solid #334155;
      border-radius: .3rem; padding: .1rem .35rem;
      font-family: 'Fira Code', monospace; font-size: .85em; color: #7dd3fc;
    }
    .rich-editor pre {
      background: #0f172a; border: 1px solid #334155;
      border-radius: .5rem; padding: 1rem;
      overflow-x: auto; margin-bottom: .85rem;
    }
    .rich-editor blockquote {
      border-left: 3px solid #6366f1;
      padding-left: 1rem; margin-left: 0;
      color: #94a3b8; font-style: italic;
    }
    .rich-editor a { color: #818cf8; text-decoration: underline; }
    /* Toolbar buttons */
    .fmt-btn {
      padding: .25rem .5rem;
      border-radius: .35rem;
      font-size: .75rem;
      color: #94a3b8;
      background: transparent;
      transition: background .15s, color .15s;
      cursor: pointer;
      border: none;
    }
    .fmt-btn:hover { background: #334155; color: #e2e8f0; }
    .fmt-btn.active { background: #6366f1; color: white; }
  `],
  template: `
    <div class="h-screen flex flex-col bg-slate-950 text-white overflow-hidden">

      <!-- TOP BAR -->
      <header class="shrink-0 border-b border-slate-800 bg-slate-950/90 backdrop-blur-xl">
        <div class="flex items-center justify-between px-4 h-14">
          <div class="flex items-center gap-3">
            <button
              id="back-to-dashboard"
              [routerLink]="['/dashboard']"
              class="text-slate-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-slate-800">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div class="w-px h-5 bg-slate-700"></div>
            <div class="w-6 h-6 rounded-md bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13" />
              </svg>
            </div>
            <span class="text-sm font-semibold truncate max-w-xs text-slate-200">
              @if (content()) { {{ activeChapter()?.title ?? 'E-book editor' }} }
              @else { Cargando editor... }
            </span>
          </div>

          <div class="flex items-center gap-3">
            <!-- View toggle -->
            <div class="flex items-center bg-slate-800/60 border border-slate-700/50 rounded-lg p-0.5">
              <button
                id="view-visual"
                (click)="switchToVisual()"
                [class]="editorMode() === 'visual'
                  ? 'px-3 py-1 rounded-md text-xs font-medium bg-indigo-600 text-white transition-all'
                  : 'px-3 py-1 rounded-md text-xs font-medium text-slate-400 hover:text-white transition-all'">
                ✏️ Visual
              </button>
              <button
                id="view-html"
                (click)="switchToHtml()"
                [class]="editorMode() === 'html'
                  ? 'px-3 py-1 rounded-md text-xs font-medium bg-slate-700 text-slate-200 transition-all'
                  : 'px-3 py-1 rounded-md text-xs font-medium text-slate-400 hover:text-white transition-all'">
                &lt;/&gt; HTML
              </button>
            </div>

            <!-- Credits -->
            <div class="hidden sm:flex items-center gap-1.5 bg-slate-800/60 border border-slate-700/50 rounded-lg px-2.5 py-1">
              <svg class="w-3.5 h-3.5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clip-rule="evenodd" />
              </svg>
              <span class="text-xs font-semibold text-yellow-300">{{ credits() }}</span>
            </div>

            <!-- Save -->
            <button
              id="save-changes-btn"
              (click)="onSave()"
              [disabled]="saveLoading() || !activeSection()"
              class="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-all duration-200">
              @if (saveLoading()) {
                <svg class="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
              } @else {
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
              }
              Guardar
            </button>
          </div>
        </div>
      </header>

      <!-- MAIN LAYOUT -->
      <div class="flex-1 flex overflow-hidden">

        <!-- SIDEBAR -->
        <aside class="w-64 shrink-0 border-r border-slate-800 overflow-y-auto bg-slate-900/40">
          @if (contentLoading()) {
            <div class="p-4 space-y-3 animate-pulse">
              @for (i of [1,2,3]; track i) {
                <div class="h-4 bg-slate-700 rounded w-3/4"></div>
                <div class="ml-3 space-y-2">
                  <div class="h-3 bg-slate-800 rounded w-4/5"></div>
                  <div class="h-3 bg-slate-800 rounded w-2/3"></div>
                </div>
              }
            </div>
          } @else if (content()) {
            <div class="p-3">
              <p class="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3 px-2">Contenido</p>
              @for (chapter of content()!.chapters; track chapter.id) {
                <div class="mb-2">
                  <div class="flex items-center gap-2 px-2 py-1.5 rounded-lg mb-1">
                    <svg class="w-3.5 h-3.5 text-indigo-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <span class="text-xs font-semibold text-slate-300 truncate">{{ chapter.title }}</span>
                  </div>
                  @for (section of chapter.sections; track section.id) {
                    <button
                      [id]="'section-' + section.id"
                      (click)="selectSection(chapter, section)"
                      [class]="isActive(chapter.id, section.id)
                        ? 'w-full text-left text-xs px-4 py-2 rounded-lg text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 mb-0.5 font-medium truncate transition-all'
                        : 'w-full text-left text-xs px-4 py-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 mb-0.5 truncate transition-all'">
                      {{ section.title }}
                    </button>
                  }
                </div>
              }
            </div>
          }
        </aside>

        <!-- CANVAS + AI PANEL -->
        <div class="flex-1 flex flex-col overflow-hidden">

          <!-- EDITOR CANVAS -->
          <div class="flex-1 overflow-y-auto">
            @if (!activeSection()) {
              <div class="h-full flex items-center justify-center text-slate-600">
                <div class="text-center">
                  <svg class="w-12 h-12 mx-auto mb-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <p class="font-medium text-sm">Selecciona una sección para editar</p>
                  <p class="text-xs mt-1">Usa el panel izquierdo para navegar el contenido</p>
                </div>
              </div>
            } @else {
              <div class="max-w-3xl mx-auto px-6 py-5">

                <!-- Breadcrumb -->
                <p class="text-xs text-slate-500 mb-3 uppercase tracking-wider font-medium">
                  {{ activeChapter()?.title }} › {{ activeSection()?.title }}
                </p>

                <!-- Alerts -->
                @if (saveSuccess()) {
                  <div class="mb-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 text-emerald-400 text-xs">
                    ✓ Cambios guardados exitosamente
                  </div>
                }
                @if (saveError()) {
                  <div class="mb-4 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-2 text-red-400 text-xs">
                    {{ saveError() }}
                  </div>
                }

                <!-- ── VISUAL MODE ── -->
                @if (editorMode() === 'visual') {
                  <!-- Formatting toolbar -->
                  <div class="flex items-center gap-1 mb-2 px-3 py-2 bg-slate-900/60 border border-slate-700/50 rounded-t-xl border-b-0">
                    <button class="fmt-btn font-bold" title="Negrita" (click)="execCmd('bold')"><b>B</b></button>
                    <button class="fmt-btn italic" title="Cursiva" (click)="execCmd('italic')"><i>I</i></button>
                    <button class="fmt-btn" title="Subrayado" (click)="execCmd('underline')"><u>U</u></button>
                    <div class="w-px h-4 bg-slate-700 mx-1"></div>
                    <button class="fmt-btn" title="H2" (click)="execCmd('formatBlock', '<h2>')">H2</button>
                    <button class="fmt-btn" title="H3" (click)="execCmd('formatBlock', '<h3>')">H3</button>
                    <button class="fmt-btn" title="Párrafo" (click)="execCmd('formatBlock', '<p>')">¶</button>
                    <div class="w-px h-4 bg-slate-700 mx-1"></div>
                    <button class="fmt-btn" title="Lista viñeta" (click)="execCmd('insertUnorderedList')">• —</button>
                    <button class="fmt-btn" title="Lista numerada" (click)="execCmd('insertOrderedList')">1.</button>
                    <div class="w-px h-4 bg-slate-700 mx-1"></div>
                    <button class="fmt-btn" title="Limpiar formato" (click)="execCmd('removeFormat')">✕</button>
                  </div>

                  <!-- contenteditable area -->
                  <div
                    #richEditor
                    id="section-editor-visual"
                    contenteditable="true"
                    class="rich-editor w-full bg-slate-900/60 border border-slate-700/50 rounded-b-2xl px-6 py-5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    (input)="onRichInput()"
                    (blur)="syncFromRich()">
                  </div>
                }

                <!-- ── HTML MODE ── -->
                @if (editorMode() === 'html') {
                  <textarea
                    id="section-editor-html"
                    [(ngModel)]="editorContent"
                    rows="22"
                    class="w-full bg-slate-900/60 border border-slate-700/50 text-slate-200 rounded-2xl px-5 py-4 text-sm font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
                    placeholder="El contenido HTML de la sección aparecerá aquí...">
                  </textarea>
                }
              </div>
            }
          </div>

          <!-- AI ASSISTANCE PANEL -->
          <div class="shrink-0 border-t border-slate-800 bg-slate-900/60 p-4">
            <div class="max-w-3xl mx-auto">
              <div class="flex items-center gap-2 mb-3">
                <div class="w-5 h-5 rounded-md bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                  <svg class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                  </svg>
                </div>
                <span class="text-xs font-semibold text-slate-300">Asistente IA</span>
                <span class="text-xs text-slate-600 ml-auto">10 créditos por uso</span>
              </div>

              @if (aiError()) {
                <div class="mb-2 rounded-xl bg-red-500/10 border border-red-500/20 px-3 py-2 text-red-400 text-xs">
                  {{ aiError() }}
                </div>
              }
              @if (aiSuccess()) {
                <div class="mb-2 rounded-xl bg-violet-500/10 border border-violet-500/20 px-3 py-2 text-violet-300 text-xs">
                  ✨ Contenido generado e insertado en la sección
                </div>
              }

              <div class="flex gap-2">
                <input
                  id="ai-prompt-input"
                  type="text"
                  [(ngModel)]="aiPrompt"
                  placeholder="Ej: Expande este párrafo con más ejemplos prácticos..."
                  [disabled]="aiLoading() || !activeSection()"
                  class="flex-1 bg-slate-800/50 border border-slate-700/50 text-white placeholder-slate-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all disabled:opacity-40" />
                <button
                  id="ai-generate-btn"
                  (click)="onAiGenerate()"
                  [disabled]="aiLoading() || !aiPrompt.trim() || !activeSection()"
                  class="shrink-0 flex items-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all duration-200 shadow-lg shadow-violet-500/20 whitespace-nowrap">
                  @if (aiLoading()) {
                    <svg class="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                    Procesando...
                  } @else {
                    ✨ Asistir con IA (10 créditos)
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class EditorComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('richEditor') private richEditorRef!: ElementRef<HTMLDivElement>;

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly ebookService = inject(EbookService);
  private readonly billingService = inject(BillingService);

  readonly content = signal<EbookContent | null>(null);
  readonly contentLoading = signal(true);
  readonly activeChapter = signal<Chapter | null>(null);
  readonly activeSection = signal<Section | null>(null);

  /** Raw HTML string — single source of truth for both modes */
  editorContent = '';
  aiPrompt = '';

  /** 'visual' = contenteditable preview | 'html' = raw textarea */
  readonly editorMode = signal<'visual' | 'html'>('visual');

  readonly credits = signal<number>(0);
  readonly saveLoading = signal(false);
  readonly saveSuccess = signal(false);
  readonly saveError = signal('');
  readonly aiLoading = signal(false);
  readonly aiError = signal('');
  readonly aiSuccess = signal(false);

  private ebookId = '';

  ngOnInit(): void {
    this.ebookId = this.route.snapshot.paramMap.get('id') ?? '';
    this.loadContent();
    this.loadCredits();
  }

  ngAfterViewInit(): void {
    // Initial render if section already selected (e.g. after navigation)
    this.renderRich();
  }

  ngOnDestroy(): void {}

  // ── Content loading ──────────────────────────────────────────

  loadContent(): void {
    this.contentLoading.set(true);
    this.ebookService.getEbookContent(this.ebookId).subscribe({
      next: (data) => {
        this.content.set(data);
        this.contentLoading.set(false);
        if (data.chapters.length > 0 && data.chapters[0].sections.length > 0) {
          this.selectSection(data.chapters[0], data.chapters[0].sections[0]);
        }
      },
      error: () => this.contentLoading.set(false),
    });
  }

  loadCredits(): void {
    this.billingService.getBalance().subscribe({
      next: (res) => this.credits.set(res.credits_available),
    });
  }

  // ── Section selection ────────────────────────────────────────

  selectSection(chapter: Chapter, section: Section): void {
    // Sync HTML textarea → editorContent before switching section
    if (this.editorMode() === 'html') {
      // already in sync via ngModel
    }
    this.activeChapter.set(chapter);
    this.activeSection.set(section);
    this.editorContent = section.html ?? '';
    this.saveSuccess.set(false);
    this.saveError.set('');
    this.aiSuccess.set(false);
    this.aiError.set('');
    // Re-render the contenteditable after signal+DOM update
    setTimeout(() => this.renderRich(), 0);
  }

  isActive(chapterId: string, sectionId: string): boolean {
    return (
      this.activeChapter()?.id === chapterId &&
      this.activeSection()?.id === sectionId
    );
  }

  // ── Editor mode switching ────────────────────────────────────

  /** Switch to Visual mode: set signal first, then render after DOM is ready */
  switchToVisual(): void {
    // editorContent is already in sync via ngModel on the textarea
    this.editorMode.set('visual');
    // Wait two ticks: one for signal propagation, one for Angular to create the @ViewChild element
    setTimeout(() => setTimeout(() => this.renderRich()));
  }

  /** Switch to HTML mode: sync rich → textarea */
  switchToHtml(): void {
    this.syncFromRich();
    this.editorMode.set('html');
  }

  /** Sync contenteditable innerHTML → editorContent */
  syncFromRich(): void {
    if (this.richEditorRef?.nativeElement) {
      this.editorContent = this.richEditorRef.nativeElement.innerHTML;
    }
  }

  /** On rich editor input: keep editorContent in sync */
  onRichInput(): void {
    if (this.richEditorRef?.nativeElement) {
      this.editorContent = this.richEditorRef.nativeElement.innerHTML;
    }
  }

  /** Render editorContent into the contenteditable div */
  private renderRich(): void {
    if (this.editorMode() === 'visual' && this.richEditorRef?.nativeElement) {
      this.richEditorRef.nativeElement.innerHTML = this.editorContent;
    }
  }

  /** Format command for the toolbar */
  execCmd(cmd: string, value?: string): void {
    // formatBlock requires angle-bracket tags in most browsers
    const val = (cmd === 'formatBlock' && value && !value.startsWith('<'))
      ? `<${value}>`
      : value;
    document.execCommand(cmd, false, val);
    this.richEditorRef?.nativeElement?.focus();
    this.onRichInput();
  }

  // ── Save ─────────────────────────────────────────────────────

  onSave(): void {
    const section = this.activeSection();
    const chapter = this.activeChapter();
    if (!section || !chapter) return;

    // Always get latest HTML from the active mode
    if (this.editorMode() === 'visual') this.syncFromRich();

    this.saveLoading.set(true);
    this.saveSuccess.set(false);
    this.saveError.set('');

    this.ebookService
      .patchEbookContent(this.ebookId, {
        sections: [
          {
            chapter_id: chapter.id,
            section_id: section.id,
            html: this.editorContent,
          },
        ],
      })
      .subscribe({
        next: () => {
          this.saveLoading.set(false);
          this.saveSuccess.set(true);
          const updated = { ...section, html: this.editorContent };
          this.activeSection.set(updated);
          this.content.update((c) => {
            if (!c) return c;
            return {
              ...c,
              chapters: c.chapters.map((ch) =>
                ch.id === chapter.id
                  ? {
                      ...ch,
                      sections: ch.sections.map((s) =>
                        s.id === section.id ? updated : s
                      ),
                    }
                  : ch
              ),
            };
          });
          setTimeout(() => this.saveSuccess.set(false), 3000);
        },
        error: (err) => {
          this.saveLoading.set(false);
          this.saveError.set(err?.error?.detail || 'Error al guardar');
        },
      });
  }

  // ── AI Generate ──────────────────────────────────────────────

  onAiGenerate(): void {
    const section = this.activeSection();
    const chapter = this.activeChapter();
    if (!section || !chapter || !this.aiPrompt.trim()) return;

    // Sync current visual content before appending
    if (this.editorMode() === 'visual') this.syncFromRich();

    this.aiLoading.set(true);
    this.aiError.set('');
    this.aiSuccess.set(false);

    this.ebookService
      .generateWithAi({
        ebook_id: this.ebookId,
        chapter_id: chapter.id,
        section_id: section.id,
        // Enrich prompt with chapter/section context so the AI stays on topic
        prompt: this.buildEnrichedPrompt(chapter, section),
      })
      .subscribe({
        next: (res) => {
          this.aiLoading.set(false);

          // ── FIX: el backend devuelve 'generated_html', no 'html' ──
          const newHtml = res.generated_html ?? res.html ?? '';

          // Append new content to existing
          this.editorContent = this.editorContent + '\n' + newHtml;

          // Refresh the rich editor view
          setTimeout(() => this.renderRich(), 0);

          this.aiPrompt = '';
          this.aiSuccess.set(true);

          // Update credits
          const credits = res.credits_available ?? res.credits_remaining;
          if (credits !== undefined) {
            this.credits.set(credits);
          } else {
            this.loadCredits();
          }
          setTimeout(() => this.aiSuccess.set(false), 4000);
        },
        error: (err) => {
          this.aiLoading.set(false);
          this.aiError.set(err?.error?.detail || 'Error en la generación IA');
        },
      });
  }

  // ── Context helpers ──────────────────────────────────────────

  /**
   * Builds a context-enriched prompt so the AI knows which chapter/section
   * it's working on and keeps the content coherent with the existing text.
   */
  private buildEnrichedPrompt(chapter: Chapter, section: Section): string {
    const currentText = this.stripHtml(this.editorContent).slice(0, 600);
    const lines: string[] = [
      `Estás editando un e-book.`,
      `Capítulo actual: "${chapter.title}"`,
      `Sección actual: "${section.title}"`,
    ];
    if (currentText) {
      lines.push(
        `Contenido existente en esta sección (mantén coherencia y temática): "${currentText}"`
      );
    }
    lines.push(`Instrucción del usuario: ${this.aiPrompt}`);
    return lines.join('\n');
  }

  /** Strip HTML tags to extract plain text for context */
  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  }
}
