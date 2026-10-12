import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 flex items-center justify-center p-4">
      <!-- Background decoration -->
      <div class="absolute inset-0 overflow-hidden pointer-events-none">
        <div class="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-indigo-600/10 blur-3xl"></div>
        <div class="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-violet-600/10 blur-3xl"></div>
      </div>

      <div class="relative w-full max-w-md">
        <!-- Logo / Brand -->
        <div class="text-center mb-8">
          <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 mb-4 shadow-lg shadow-indigo-500/30">
            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h1 class="text-3xl font-bold text-white tracking-tight">Pinta<span class="text-indigo-400">Ebook</span></h1>
          <p class="text-slate-400 mt-2 text-sm">Tu asistente de escritura con IA</p>
        </div>

        <!-- Card -->
        <div class="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden">
          <!-- Tabs -->
          <div class="flex border-b border-slate-700/50">
            <button
              (click)="setTab('login')"
              [class]="tab() === 'login'
                ? 'flex-1 py-4 text-sm font-semibold text-indigo-400 border-b-2 border-indigo-500 bg-indigo-500/5 transition-all duration-200'
                : 'flex-1 py-4 text-sm font-medium text-slate-500 hover:text-slate-300 transition-all duration-200'">
              Iniciar Sesión
            </button>
            <button
              (click)="setTab('register')"
              [class]="tab() === 'register'
                ? 'flex-1 py-4 text-sm font-semibold text-indigo-400 border-b-2 border-indigo-500 bg-indigo-500/5 transition-all duration-200'
                : 'flex-1 py-4 text-sm font-medium text-slate-500 hover:text-slate-300 transition-all duration-200'">
              Registrarse
            </button>
          </div>

          <div class="p-8">
            <!-- Error Alert -->
            @if (errorMsg()) {
              <div class="mb-5 flex items-start gap-3 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-red-400 text-sm animate-fade-in">
                <svg class="w-4 h-4 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                </svg>
                {{ errorMsg() }}
              </div>
            }

            <!-- Success Alert -->
            @if (successMsg()) {
              <div class="mb-5 flex items-start gap-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 text-emerald-400 text-sm animate-fade-in">
                <svg class="w-4 h-4 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
                {{ successMsg() }}
              </div>
            }

            <!-- LOGIN FORM -->
            @if (tab() === 'login') {
              <form [formGroup]="loginForm" (ngSubmit)="onLogin()" class="space-y-5">
                <div>
                  <label class="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Email</label>
                  <input
                    id="login-email"
                    type="email"
                    formControlName="email"
                    placeholder="tu@email.com"
                    class="w-full bg-slate-800/50 border border-slate-600/50 text-white placeholder-slate-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200" />
                  @if (loginForm.get('email')?.touched && loginForm.get('email')?.invalid) {
                    <p class="mt-1 text-xs text-red-400">Email requerido</p>
                  }
                </div>

                <div>
                  <label class="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Contraseña</label>
                  <input
                    id="login-password"
                    type="password"
                    formControlName="password"
                    placeholder="••••••••"
                    class="w-full bg-slate-800/50 border border-slate-600/50 text-white placeholder-slate-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200" />
                </div>

                <button
                  id="login-submit"
                  type="submit"
                  [disabled]="loading() || loginForm.invalid"
                  class="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all duration-200 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 text-sm tracking-wide">
                  @if (loading()) {
                    <span class="flex items-center justify-center gap-2">
                      <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                      </svg>
                      Ingresando...
                    </span>
                  } @else {
                    Iniciar Sesión
                  }
                </button>
              </form>
            }

            <!-- REGISTER FORM -->
            @if (tab() === 'register') {
              <form [formGroup]="registerForm" (ngSubmit)="onRegister()" class="space-y-5">
                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Nombre</label>
                    <input
                      id="register-first-name"
                      type="text"
                      formControlName="first_name"
                      placeholder="Juan"
                      class="w-full bg-slate-800/50 border border-slate-600/50 text-white placeholder-slate-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200" />
                    @if (registerForm.get('first_name')?.touched && registerForm.get('first_name')?.invalid) {
                      <p class="mt-1 text-xs text-red-400">Nombre requerido</p>
                    }
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Apellido</label>
                    <input
                      id="register-last-name"
                      type="text"
                      formControlName="last_name"
                      placeholder="Pérez"
                      class="w-full bg-slate-800/50 border border-slate-600/50 text-white placeholder-slate-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200" />
                    @if (registerForm.get('last_name')?.touched && registerForm.get('last_name')?.invalid) {
                      <p class="mt-1 text-xs text-red-400">Apellido requerido</p>
                    }
                  </div>
                </div>

                <div>
                  <label class="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Email</label>
                  <input
                    id="register-email"
                    type="email"
                    formControlName="email"
                    placeholder="tu@email.com"
                    class="w-full bg-slate-800/50 border border-slate-600/50 text-white placeholder-slate-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200" />
                  @if (registerForm.get('email')?.touched && registerForm.get('email')?.invalid) {
                    <p class="mt-1 text-xs text-red-400">Email válido requerido</p>
                  }
                </div>

                <div>
                  <label class="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Contraseña</label>
                  <input
                    id="register-password"
                    type="password"
                    formControlName="password"
                    placeholder="Mínimo 8 caracteres"
                    class="w-full bg-slate-800/50 border border-slate-600/50 text-white placeholder-slate-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200" />
                  @if (registerForm.get('password')?.touched && registerForm.get('password')?.hasError('minlength')) {
                    <p class="mt-1 text-xs text-red-400">Mínimo 8 caracteres</p>
                  }
                </div>

                <div>
                  <label class="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Confirmar Contraseña</label>
                  <input
                    id="register-confirm"
                    type="password"
                    formControlName="password_confirm"
                    placeholder="••••••••"
                    class="w-full bg-slate-800/50 border border-slate-600/50 text-white placeholder-slate-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200" />
                  @if (registerForm.hasError('passwordMismatch') && registerForm.get('password_confirm')?.touched) {
                    <p class="mt-1 text-xs text-red-400">Las contraseñas no coinciden</p>
                  }
                </div>

                <button
                  id="register-submit"
                  type="submit"
                  [disabled]="loading() || registerForm.invalid"
                  class="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all duration-200 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 text-sm tracking-wide">
                  @if (loading()) {
                    <span class="flex items-center justify-center gap-2">
                      <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                      </svg>
                      Registrando...
                    </span>
                  } @else {
                    Crear Cuenta
                  }
                </button>
              </form>
            }
          </div>
        </div>

        <p class="text-center text-slate-600 text-xs mt-6">
          API: <span class="text-slate-500 font-mono">{{ apiUrl }}</span>
        </p>
      </div>
    </div>
  `,
})
export class AuthComponent {
  readonly apiUrl = environment.apiUrl;

  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  readonly tab = signal<'login' | 'register'>('login');
  readonly loading = signal(false);
  readonly errorMsg = signal('');
  readonly successMsg = signal('');

  readonly loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  readonly registerForm: FormGroup = this.fb.group({
    first_name: ['', Validators.required],
    last_name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    password_confirm: ['', Validators.required],
  }, { validators: this.passwordMatchValidator });

  setTab(tab: 'login' | 'register'): void {
    this.tab.set(tab);
    this.errorMsg.set('');
    this.successMsg.set('');
  }

  onLogin(): void {
    if (this.loginForm.invalid) return;
    this.loading.set(true);
    this.errorMsg.set('');

    this.authService.login(this.loginForm.value).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMsg.set(
          err?.error?.detail || err?.error?.non_field_errors?.[0] || 'Error al iniciar sesión'
        );
      },
    });
  }

  passwordMatchValidator(group: FormGroup) {
    const pw = group.get('password')?.value;
    const confirm = group.get('password_confirm')?.value;
    return pw === confirm ? null : { passwordMismatch: true };
  }

  onRegister(): void {
    if (this.registerForm.invalid) return;
    this.loading.set(true);
    this.errorMsg.set('');

    const { password_confirm, ...payload } = this.registerForm.value;

    this.authService.register(payload).subscribe({
      next: () => {
        this.loading.set(false);
        this.successMsg.set('¡Cuenta creada! Redirigiendo...');
        setTimeout(() => this.router.navigate(['/dashboard']), 1200);
      },
      error: (err) => {
        this.loading.set(false);
        const errors = err?.error;
        const firstKey = errors ? Object.keys(errors)[0] : null;
        this.errorMsg.set(
          firstKey ? `${firstKey}: ${errors[firstKey][0]}` : 'Error al registrarse'
        );
      },
    });
  }
}
