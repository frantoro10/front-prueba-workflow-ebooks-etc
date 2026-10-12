# Integración de Mercado Pago en el front (Angular)

Guía para consumir el módulo de **billing** del backend: listar paquetes de créditos, pagar con Mercado Pago (Checkout Pro) y confirmar la acreditación.

> Detalle completo del backend (endpoints, webhook, variables de entorno, despliegue):
> `Pintaebook_backend/documentacion-guia/workflow_billing_guia_actual.md`

---

## 1. Qué se agregó en este proyecto

| Archivo | Para qué |
|---|---|
| `src/app/core/services/billing.service.ts` | Servicio HTTP: `getBalance()`, `getPackages()`, `createCheckout()` |
| `src/app/features/billing/packages.component.ts` | Ruta `/billing`: lista los paquetes y el botón **Comprar** |
| `src/app/features/billing/payment-result.component.ts` | Ruta `/billing/result/:outcome`: confirma la acreditación consultando el saldo |
| `src/app/app.routes.ts` | Registra las dos rutas anteriores (con `authGuard`) |
| `src/app/features/dashboard/dashboard.component.ts` | Banner "Ver paquetes de créditos" y botón "+ Comprar créditos" |

---

## 2. Flujo

```
Usuario ─► /billing ─► GET  /api/billing/packages/        (lista de paquetes)
        ─► [Comprar] ─► POST /api/billing/checkout/        { paquete_id }  →  { init_point }
        ─► window.location.href = init_point               (sale a Mercado Pago)
        ─► paga en Mercado Pago (usuario COMPRADOR de prueba)
        ─► vuelve a /billing/result/success                (en producción; ver nota)
        ─► GET /api/billing/balance/  cada 3 s             hasta que el saldo suba
```

Quien acredita los créditos es **el backend** (por webhook, de servidor a servidor). El front solo redirige y consulta el saldo.

---

## 3. Contrato de los endpoints

Todos requieren `Authorization: Bearer <access_token>` (lo agrega `jwt.interceptor.ts`).

| Método | Ruta | Body | Respuesta |
|---|---|---|---|
| `GET` | `/api/billing/packages/` | — | `[{ id, nombre, cantidad_creditos, precio }]` |
| `POST` | `/api/billing/checkout/` | `{ "paquete_id": 1 }` | `201 { "init_point": "https://..." }` |
| `GET` | `/api/billing/balance/` | — | `{ credits_available, last_updated }` |

- `precio` llega como **string** (`"1000.00"`): convertir con `Number()` solo para mostrarlo.
- **No enviar el precio** al checkout: lo decide el backend.

### Errores del checkout (decidir por el código HTTP, no por el texto)

| Código | Significado | Qué mostrar |
|---|---|---|
| `400` | Paquete no comprable o body inválido | "El paquete no se puede comprar" |
| `401` | Sesión vencida | Ir a login |
| `404` | El paquete no existe | Recargar paquetes |
| `502` / `503` | Mercado Pago no disponible | "Intentá de nuevo en unos minutos" |

---

## 4. Cómo integrarlo en otro proyecto Angular

1. **Copiar** `billing.service.ts` y ajustar la URL base de la API.
2. **Copiar** los dos componentes de `features/billing/` (o adaptarlos a tu UI).
3. **Registrar las rutas** en `app.routes.ts`:

```ts
{ path: 'billing', loadComponent: () => import('./features/billing/packages.component').then(m => m.PackagesComponent), canActivate: [authGuard] },
{ path: 'billing/result/:outcome', loadComponent: () => import('./features/billing/payment-result.component').then(m => m.PaymentResultComponent), canActivate: [authGuard] },
```

4. **Agregar un acceso** desde la app (botón o enlace con `routerLink="/billing"`).
5. **Coordinar con el backend** las URLs de retorno (`MERCADOPAGO_BACK_URL_*`): deben coincidir con las rutas del paso 3.

### Código clave: el botón "Comprar"

```ts
buy(pkg: CreditPackage) {
  if (this.buyingId() !== null) return;                       // evita el doble clic
  this.buyingId.set(pkg.id);
  sessionStorage.setItem('balance_before_checkout', String(this.balance() ?? 0));

  this.billing.createCheckout(pkg.id).subscribe({
    next: ({ init_point }) => { window.location.href = init_point; },   // navegación completa
    error: (err) => { this.buyingId.set(null); /* mostrar error según err.status */ },
  });
}
```

### Qué NO hacer

- ❌ Llamar al webhook (`/api/billing/webhook/`): lo llama Mercado Pago.
- ❌ Confiar en los parámetros de la URL de retorno (`?status=approved`): cualquiera los puede escribir.
- ❌ Sumar créditos en el cliente al volver del pago.
- ❌ Permitir doble clic en "Comprar" (cada clic crea una transacción pendiente).

---

## 5. Cómo probarlo (modo prueba)

Requisitos: backend y front levantados, **ngrok abierto** y el `.env` del backend completo (ver la guía del backend, sección 8).

1. Abrir `http://localhost:4200`, iniciar sesión.
2. Dashboard → **Ver paquetes de créditos** (o ir a `/billing`).
3. Elegir un paquete y pulsar **Comprar**: se abre Mercado Pago.
4. **Iniciar sesión con el usuario comprador de prueba** (no con la cuenta real ni la del vendedor).
5. Pagar con una tarjeta de prueba, titular **`APRO`** (aprueba), DNI `12345678`, y **elegir las cuotas**.
6. Volver al dashboard (o abrir `/billing/result/success`) y verificar que el saldo subió.

Tarjeta de prueba (Argentina): Mastercard `5031 7557 3453 0604`, vence `11/30`, CVV `123`. Verificar datos vigentes en la documentación oficial de Mercado Pago.

### Notas de comportamiento

- **En local, Mercado Pago no redirige de vuelta al front.** Descarta las URLs de retorno con `localhost`. Es lo esperado: volver a mano. En producción, con el front en `https`, se espera la redirección automática.
- **Si "Pagar" queda gris:** abrir el link en ventana de incógnito (las extensiones que bloquean scripts lo deshabilitan) e iniciar sesión con el comprador de prueba.
- **Saldo que tarda en subir:** la acreditación es asíncrona. La pantalla de resultado consulta cada 3 s durante ~30 s y, si no llega, informa que el pago se está procesando (no es un error).

---

## 6. Antes de desplegar

- **URL de la API centralizada:** todos los servicios leen `environment.apiUrl` (`src/environments/environment.ts`). El host del WebSocket se deriva de esa misma URL.
  - Desarrollo: `http://localhost:8000/api` (`environment.ts`).
  - Producción: editar `src/environments/environment.prod.ts` y reemplazar `https://CAMBIAR-POR-URL-DEL-BACKEND/api` por la URL `https` del backend desplegado (sin barra final, terminada en `/api`). `ng build` (configuración *production*) lo usa automáticamente.
- El front en producción debe servirse por **`https`** (el WebSocket pasa a `wss://` solo) y su dominio debe estar en `CORS_ALLOWED_ORIGINS` del backend.
- Las URLs de retorno del backend (`MERCADOPAGO_BACK_URL_*`) deben apuntar al dominio público del front (`https://<front>/billing/result/success`, `.../failure`, `.../pending`).
