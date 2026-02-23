# 2. Home Verification Reports — Endpoints

Base URL configurada en `VITE_API_BASE_URL` (sin sufijo de versión adicional, la ruta completa incluye el prefijo que defina el backend, ej. `https://api.example.com/api/v1`).

---

## Endpoints consumidos

### 1. Obtener todos los reportes (resumen)

```
GET /web/reports
```

- **Autenticación:** Bearer JWT (interceptor automático)
- **Usado en:** `FetchAllReportsUseCase` → `store.fetchAll()` → vista `reports-management.vue`
- **Respuesta esperada:** Array de objetos de reporte resumido
- **Notas:** Los datos se mapean a `ReportSummary` entities vía `ReportSummaryAssembler`

---

### 2. Obtener un reporte por ID (detalle completo)

```
GET /web/reports/{reportId}
```

| Parámetro | Tipo | Descripción |
|---|---|---|
| `reportId` | `integer` | ID del reporte (> 0) |

- **Autenticación:** Bearer JWT
- **Usado en:** `FetchReportByIdUseCase` → `store.fetchById(id)` → vista `report-detail.vue`
- **Respuesta esperada:** Objeto completo del reporte con todas las secciones (dirección, zona, entrevista, anexos, etc.)
- **Notas:** Los datos se mapean a la entidad `Report` vía `ReportAssembler`

---

### 3. Actualizar entrevista con el arrendador

```
PATCH /web/reports/order/{orderId}/landlord-interview
```

| Parámetro | Tipo | Descripción |
|---|---|---|
| `orderId` | `integer` | ID de la orden de verificación (> 0) |

**Body (JSON):**

| Campo | Tipo | Descripción |
|---|---|---|
| `clientNameAccordingToLandlord` | `string` | Nombre del inquilino según el arrendador |
| `ownHouse` | `boolean` | ¿El arrendador es dueño de la vivienda? |
| `serviceClientPays` | `boolean` | ¿El cliente paga los servicios? |
| `clientPaysPunctual` | `boolean` | ¿El cliente paga puntualmente? |
| `clientRentalTime` | `string` | Tiempo de alquiler del cliente |
| `clientFloorNumber` | `string` | Piso/número donde vive el cliente |
| `interviewObservation` | `string` \| `null` | Observación de la entrevista (opcional) |

- **Autenticación:** Bearer JWT
- **Usado en:** `UpdateLandlordInterviewUseCase` → `store.updateLandlordInterview(orderId, data)` → componente `landlord-interview-card.vue`
- **Notas:** El mapeo de campos se realiza en `UpdateLandlordInterviewCommandAssembler`

---

### 4. Actualizar reporte (resultado, resumen, observaciones, glosario, casuísticas)

```
PATCH /web/reports/{reportId}
```

| Parámetro | Tipo | Descripción |
|---|---|---|
| `reportId` | `integer` | ID del reporte (> 0) |

**Body (JSON):**

| Campo | Tipo | Valores posibles | Descripción |
|---|---|---|---|
| `finalResult` | `string` | `CONFORME`, `OBSERVADO`, `RECHAZADO` | Resultado final de la verificación |
| `summary` | `string` | — | Resumen del reporte |
| `observations` | `string[]` | — | Lista de observaciones |
| `glossary` | `string[]` | — | Lista de términos del glosario |
| `casuistics` | `string[]` | — | Lista de casuísticas |
| `isResultValid` | `boolean` | — | Indica si el resultado final es válido/confirmado |

- **Autenticación:** Bearer JWT
- **Usado en:** `UpdateReportUseCase` → `store.updateReport(reportId, data)` → vista `report-detail.vue`
- **Notas:** El mapeo de campos se realiza en `UpdateReportCommandAssembler`; solo se envían los campos que tienen valor

---

### 5. Obtener URL de descarga del PDF

```
GET /web/reports/{reportId}/download-url
```

| Parámetro | Tipo | Descripción |
|---|---|---|
| `reportId` | `integer` | ID del reporte (> 0) |

- **Autenticación:** Bearer JWT
- **Usado en:** `store.getReportDownloadUrl(reportId)` → vista `report-detail.vue` (botón de descarga PDF)
- **Respuesta esperada:** Objeto con la URL temporal de descarga del PDF generado

---

### 6. Actualizar un attachment (foto/anexo) existente

```
PATCH /web/reports/{reportId}/attachment/{attachmentId}
```

| Parámetro | Tipo | Descripción |
|---|---|---|
| `reportId` | `integer` | ID del reporte (> 0) |
| `attachmentId` | `integer` | ID del attachment a reemplazar (> 0) |

**Body:** `multipart/form-data`

| Campo | Tipo | Descripción |
|---|---|---|
| `file` | `File` | Imagen de reemplazo (validada: tipo imagen, máx. 5 MB) |

- **Autenticación:** Bearer JWT
- **Usado en:** Componente `annexe-photographic-registry.vue` (acción "reemplazar foto")
- **Notas:** El `Content-Type` es seteado automáticamente por el navegador con el boundary multipart

---

### 7. Agregar un nuevo attachment (foto/anexo)

```
POST /web/reports/{reportId}/attachment
```

| Parámetro | Tipo | Descripción |
|---|---|---|
| `reportId` | `integer` | ID del reporte (> 0) |

**Body:** `multipart/form-data`

| Campo | Tipo | Descripción |
|---|---|---|
| `file` | `File` | Archivo de imagen a agregar |
| `type` | `string` | Tipo de anexo (ej: `OTROS`) |

- **Autenticación:** Bearer JWT
- **Usado en:** Componente `annexe-photographic-registry.vue` (acción "agregar foto")

---

### 8. Actualizar verificación domiciliaria completa (canal móvil)

```
PATCH /mobile/reports/order/{orderId}/home-verification
```

| Parámetro | Tipo | Descripción |
|---|---|---|
| `orderId` | `integer` | ID de la orden de verificación (> 0) |

**Body (JSON):** Objeto con todos los datos de la verificación domiciliaria

- **Autenticación:** Bearer JWT
- **Canal:** Mobile (ruta diferente a los endpoints web)
- **Notas:** Endpoint definido en `ReportApi` pero **no hay uso activo identificado** en el frontend web actualmente; podría corresponder a integración con la app móvil

---

## Resumen

| # | Método | Ruta | Uso activo |
|---|---|---|---|
| 1 | `GET` | `/web/reports` | ✅ Lista de reportes |
| 2 | `GET` | `/web/reports/{reportId}` | ✅ Detalle del reporte |
| 3 | `PATCH` | `/web/reports/order/{orderId}/landlord-interview` | ✅ Entrevista arrendador |
| 4 | `PATCH` | `/web/reports/{reportId}` | ✅ Resultado / observaciones |
| 5 | `GET` | `/web/reports/{reportId}/download-url` | ✅ Descarga PDF |
| 6 | `PATCH` | `/web/reports/{reportId}/attachment/{attachmentId}` | ✅ Reemplazar foto |
| 7 | `POST` | `/web/reports/{reportId}/attachment` | ✅ Agregar foto |
| 8 | `PATCH` | `/mobile/reports/order/{orderId}/home-verification` | ⚠️ Definido, sin uso activo web |
