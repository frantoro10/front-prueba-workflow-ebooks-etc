# Exportar un e-book como EPUB (front Angular)

Botón **📖 Exportar EPUB** en el editor: descarga el e-book terminado como archivo `.epub`. Es gratis.

> Detalle del backend (endpoint, errores, cómo se genera):
> `Pintaebook_backend/documentacion-guia/workflow_exportar_epub.md`

## Qué se agregó

| Archivo | Para qué |
|---|---|
| `src/app/core/services/ebook.service.ts` | `exportEpub(id)`: pide el archivo como `blob` y lee el nombre del header `Content-Disposition` |
| `src/app/features/editor/editor.component.ts` | Botón en la barra superior del editor y método `onExportEpub()` con manejo de errores |

## Contrato

| Método | Ruta | Respuesta |
|---|---|---|
| `GET` | `/api/ebooks/<ebook_id>/export/epub/` | `200` archivo `application/epub+zip` con `Content-Disposition: attachment; filename="..."` |

Requiere JWT (lo agrega `jwt.interceptor.ts`).

| Código | Significado | Mensaje en la UI |
|---|---|---|
| `401` | Sesión vencida | "Tu sesión venció. Volvé a iniciar sesión." |
| `404` | E-book inexistente, ajeno o sin contenido | "No se encontró el e-book o no tiene contenido." |
| `409` | E-book no terminado (`PROCESSING`/`FAILED`) o sin capítulos | "El e-book todavía no está terminado o no tiene capítulos." |
| otro | Error del servidor | "No se pudo exportar el e-book. Intentá de nuevo." |

## Cómo integrarlo en otro proyecto

1. Copiar `exportEpub()` y `filenameFrom()` de `ebook.service.ts`.
2. Descargar con un enlace temporal sobre el `Blob`:

```ts
this.ebookService.exportEpub(this.ebookId).subscribe({
  next: ({ blob, filename }) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  },
  error: (err) => { /* decidir por err.status */ },
});
```

### Por qué no un `<a href>` directo
La descarga necesita el header `Authorization: Bearer ...`, y el navegador no lo manda en un enlace común. Por eso se usa `HttpClient` con `responseType: 'blob'`.

### Ojo con los errores
Con `responseType: 'blob'`, el cuerpo de un error llega como `Blob`, no como JSON: decidir el mensaje por `err.status`.

## Cómo probarlo

1. Iniciar sesión y generar un e-book (o abrir uno en estado `COMPLETED`).
2. Abrir el editor y pulsar **📖 Exportar EPUB**: se descarga `<titulo>.epub`.
3. Abrirlo en un lector (Calibre, Thorium, Apple Books) y verificar título, autor e índice.

## Notas

- Se exporta lo que está **guardado**: pulsar **Guardar** antes de exportar si editaste algo.
- Hoy las imágenes se omiten del EPUB y no hay portada (ver limitaciones en la guía del backend).
