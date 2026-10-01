# PintaEbook — Frontend Angular

Aplicación Angular (v21) que consume la API REST y WebSocket de PintaEbook para permitir a los autores crear, editar y gestionar e-books asistidos por Inteligencia Artificial.

---

## Stack

| Tecnología | Versión | Uso |
|---|---|---|
| Angular | 21.x | Framework principal (standalone components, signals) |
| RxJS | 7.8 | Observables para HTTP y WebSocket |
| TailwindCSS | 4.x | Estilos utilitarios |
| TypeScript | 5.9 | Tipado estático |

---

## Estructura del Proyecto

```text
src/app/
|-- core/
|   |-- services/
|   |   |-- auth.service.ts           # Login, registro, tokens JWT
|   |   |-- billing.service.ts        # Consulta de créditos
|   |   |-- ebook.service.ts          # CRUD e-books, contenido y IA
|   |   `-- ebook-creation.service.ts # Flujo 2 pasos: REST + WebSocket
|   |-- guards/                       # Guardas de rutas (auth)
|   `-- interceptors/                 # HTTP interceptors (JWT en headers)
|-- features/
|   |-- auth/                         # Pantallas de login y registro
|   |-- dashboard/
|   |   `-- dashboard.component.ts    # Lista e-books + modal de generación con progreso
|   `-- editor/
|       `-- editor.component.ts       # Editor dual (visual/HTML) + asistente IA
`-- app.routes.ts
```

---

## Flujo de Generación de E-books (WebSocket)

La creación de un e-book con IA usa un flujo asíncrono de 2 pasos para evitar timeouts HTTP.

### Implementación en Angular

```
EbookCreationService.createEbook()   →  POST /api/ebooks/  →  { ebook_id, status: "PROCESSING" }
                    ↓
EbookCreationService.connectToProgress(ebook_id, token)
                    ↓
          new WebSocket(ws://localhost:8000/ws/ebooks/<ebook_id>/progress/?token=<jwt>)
                    ↓
          Subject<ProgressEvent>  →  Observable<ProgressEvent>
                    ↓
          DashboardComponent.subscribe()
            → actualiza progressPercent(), progressMessage(), progressStep()
            → al recibir status:"COMPLETED" → navega a /editor/<ebook_id>
            → al recibir status:"FAILED"    → muestra error con botón Cerrar
```

### Archivos clave

| Archivo | Responsabilidad |
|---|---|
| `ebook-creation.service.ts` | Encapsula el WebSocket nativo en un `Subject` + `Observable` |
| `dashboard.component.ts` | Modal de progreso con barra animada, puntos de paso y manejo de errores |

### `EbookCreationService` — API

```typescript
// Paso 1: disparo REST no bloqueante
createEbook(payload: CreateEbookPayload): Observable<CreateEbookResponse>

// Paso 2: abre WebSocket y retorna Observable de eventos
connectToProgress(ebookId: string, token: string): Observable<ProgressEvent>

// Cierra el socket y completa el Subject (llamar en ngOnDestroy)
disconnect(): void
```

### Interface `ProgressEvent`

```typescript
interface ProgressEvent {
  type: 'progress_update';
  step: number;           // 1 a 5
  progress: number;       // 0 a 100
  message: string;
  status?: 'PROCESSING' | 'COMPLETED' | 'FAILED';
  credits_available?: number;   // solo en step 5
  error?: string;               // solo en FAILED
}
```

### Códigos de cierre WebSocket

| Código | Acción en el frontend |
|---|---|
| `1000` | Cierre normal — el Observable completa sin error |
| `1011` | Error interno del servidor — `progressSubject.error()` → modal muestra error |
| `4001` | JWT inválido/expirado — `progressSubject.error()` → modal muestra error |
| `4003` | Sin permisos sobre el e-book — `progressSubject.error()` → modal muestra error |

---

## Editor de E-books

El editor (`/editor/:id`) ofrece dos modos de visualización y un asistente IA contextual.

### Modos del editor

| Modo | Descripción |
|---|---|
| ✏️ **Visual** | `contenteditable` que renderiza el HTML con estilos (headings, listas, negritas) |
| `</>` **HTML** | `textarea` monoespaciado con el HTML raw para edición directa |

Cambiar entre modos sincroniza automáticamente el contenido (`editorContent` como fuente única de verdad).

### Barra de formato (modo Visual)

**B** Negrita · _I_ Cursiva · <u>U</u> Subrayado · **H2** · **H3** · **¶** Párrafo · **• —** Lista · **1.** Lista ordenada · **✕** Limpiar formato

> Los comandos de bloque (`H2`, `H3`, `¶`) usan `document.execCommand('formatBlock', false, '<h2>')`.  
> Los ángulos `<>` son obligatorios — sin ellos el comando no funciona en la mayoría de los navegadores.

### Asistente IA (contextual)

Al hacer clic en **✨ Asistir con IA**, el frontend construye un prompt enriquecido automáticamente:

```
Estás editando un e-book.
Capítulo actual: "Nombre del capítulo"
Sección actual: "Nombre de la sección"
Contenido existente en esta sección (mantén coherencia y temática): "Primeros 600 caracteres del contenido actual..."
Instrucción del usuario: <texto ingresado por el usuario>
```

Esto garantiza que la IA genere contenido coherente con el e-book, sin importar qué prompt escriba el usuario.

### Campo de respuesta IA

> ⚠️ El backend devuelve `generated_html` (no `html`). El servicio TypeScript lee `res.generated_html ?? res.html ?? ''`.

---

## Variables de entorno / Configuración

Los endpoints se configuran directamente en los servicios. Para cambiar el host del backend:

| Archivo | Constante | Valor por defecto |
|---|---|---|
| `ebook.service.ts` | `BASE` | `http://localhost:8000/api` |
| `auth.service.ts` | `BASE` | `http://localhost:8000/api/auth` |
| `ebook-creation.service.ts` | `BASE_HTTP` | `http://localhost:8000/api` |
| `ebook-creation.service.ts` | `BASE_WS` | `localhost:8000` |

El protocolo del WebSocket (`ws://` vs `wss://`) se detecta automáticamente desde `window.location.protocol`.

---

## Desarrollo Local

```bash
# Instalar dependencias
npm install

# Servidor de desarrollo (hot reload)
ng serve
# → http://localhost:4200/
```

> Asegurarse de que el backend Docker esté corriendo en `localhost:8000` antes de iniciar el frontend.

---

## Build de Producción

```bash
ng build
# Artefactos en dist/
```

---

## Notas Importantes

1. **El token JWT** se almacena en `localStorage` como `access_token`. El `EbookCreationService` lo lee automáticamente al conectar el WebSocket.
2. **`ngOnDestroy`**: El `DashboardComponent` implementa `OnDestroy` y llama a `ebookCreationService.disconnect()` para limpiar el socket si el usuario navega fuera del dashboard mientras se genera un e-book.
3. **No usar `HttpClient` para WebSocket**: los WebSockets usan la API nativa del browser (`new WebSocket(...)`), envuelta en un `Subject<ProgressEvent>` para integrarse con el ecosistema RxJS.
4. **Reconexión**: Actualmente no hay lógica de reconexión automática. Si el socket cierra inesperadamente durante la generación, el modal muestra el error y el usuario puede cerrar e intentar de nuevo.
