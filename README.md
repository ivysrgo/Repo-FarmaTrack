#  FarmaTrack — Sistema de Gestión de Lotes Farmacéuticos
 
Sistema monolítico completo con **Express.js** + **EJS**, implementando el seguimiento de lotes de producción farmacéutica con arquitectura limpia, patrones arquitectónicos y principios SOLID.
 
---
 
##  Inicio rápido
 
```bash
npm install
npm run dev       # Modo desarrollo con nodemon
npm start         # Modo producción
npm test          # Ejecutar tests
```
 
Abre: [http://localhost:3000](http://localhost:3000)
 
### Credenciales de prueba
 
| Usuario | Email | Contraseña | Rol |
|---|---|---|---|
| Juan Bahos | juan.bahos@farmatrack.co | 1234 | Director Técnico |
| Sergio Velandia | sergio.velandia@farmatrack.co | 1234 | Operario |
| David Peña | david.pena@farmatrack.co | 1234 | Operario |
 
---
 
##  Arquitectura y estructura
 
```
farmatrack/
├── config/
│   ├── app.js               # Configuración centralizada (puerto, sesión, nombre app)
│   └── database.js          # Base de datos en memoria (usuarios mock)
│
├── src/
│   ├── app.js               # Bootstrap de la aplicación (Composition Root)
│   │
│   ├── models/
│   │   └── Usuario.js       # Entidad de dominio con lógica de autenticación
│   │
│   ├── repositories/
│   │   └── UsuarioRepository.js   # Persistencia en memoria (reemplazable por BD real)
│   │
│   ├── service/
│   │   └── AuthService.js         # Lógica de negocio: login, signup
│   │
│   ├── controllers/
│   │   ├── AuthController.js      # Flujo HTTP de autenticación
│   │   ├── LoteController.js      # Lógica de lotes y pasos de producción
│   │   ├── PanelController.js     # Dashboard del Director Técnico
│   │   └── NoConformidadController.js  # Registro de no conformidades
│   │
│   ├── routes/
│   │   ├── index.js               # Router principal — monta todos los módulos
│   │   ├── auth.js                # Rutas de login / signup / logout
│   │   ├── lotes.js               # Rutas RESTful de lotes y pasos
│   │   ├── panel.js               # Ruta del panel del Director Técnico
│   │   ├── noConformidad.js       # Rutas de no conformidades
│   │   └── router.js              # Router alternativo (datos mock de panel)
│   │
│   ├── middlewares/
│   │   ├── auth.js                # requireAuth / injectUser
│   │   └── errorHandler.js        # Manejo global de errores 404 / 500
│   │
│   └── utils/
│       └── AppError.js            # Error personalizado con código HTTP
│
├── views/
│   ├── layouts/
│   │   ├── main.ejs       # Layout principal con sidebar y topbar
│   │   └── auth.ejs       # Layout limpio para login / recuperar contraseña
│   ├── auth/
│   │   ├── login.ejs      # Formulario de acceso (login + registro)
│   │   ├── bienvenida.ejs # Pantalla post-login
│   │   └── recuperar.ejs  # Recuperar contraseña (demo)
│   ├── lotes/
│   │   ├── index.ejs      # Listado de lotes con filtros y KPIs
│   │   ├── nuevo.ejs      # Formulario nueva orden de producción
│   │   ├── paso1.ejs → paso9.ejs  # Formularios del proceso productivo
│   ├── panel/
│   │   └── index.ejs      # Dashboard del Director Técnico
│   ├── noconformidad/
│   │   └── nueva.ejs      # Formulario de no conformidad
│   ├── partials/
│   │   ├── stepper-aside.ejs    # Barra lateral del stepper de pasos
│   │   ├── stepper-footer.ejs   # Footer del stepper
│   │   └── stepper-topbar.ejs   # Topbar del stepper
│   └── error.ejs          # Página de error global
│
├── public/
│   ├── css/
│   │   ├── style.css            # Estilos generales
│   │   ├── farmatrack.css       # Design system principal
│   │   ├── farmatrack-tokens.json # Tokens de diseño (colores, tipografía)
│   │   ├── panel.css            # Estilos del panel/dashboard
│   │   ├── stepper.css          # Estilos del stepper de producción
│   │   └── app.css              # Estilos globales de la app
│
└── package.json
```
 
---
 
##  Patrones arquitectónicos aplicados
 
| Patrón | Dónde | Propósito |
|---|---|---|
| **MVC** | controllers / views / models | Separación de presentación, lógica y datos |
| **Repository Pattern** | repositories/ | Abstrae la persistencia; fácil de cambiar la BD |
| **Service Layer** | service/AuthService.js | Centraliza la lógica de negocio de autenticación |
| **Dependency Injection** | routes/auth.js | Desacopla servicio, repositorio y controlador |
| **Composition Root** | src/app.js + routes/index.js | Único lugar donde se ensamblan las dependencias |
| **Middleware Chain** | middlewares/ | Autenticación y manejo de errores transversal |
 
---
 
##  Principios SOLID aplicados
 
### S — Single Responsibility
- `AuthController` solo maneja HTTP de autenticación.
- `AuthService` solo contiene reglas de negocio de login/signup.
- `UsuarioRepository` solo gestiona persistencia de usuarios.
- `AppError` solo encapsula errores de dominio con código HTTP.
- `requireAuth` solo verifica si hay sesión activa.
### O — Open / Closed
- Agregar un `MongoUsuarioRepository` sin modificar `AuthService`.
- Agregar nuevas validaciones en `AuthService` sin cambiar el controlador.
### L — Liskov Substitution
- `UsuarioRepository` puede reemplazarse por cualquier implementación concreta sin romper `AuthService`.
### I — Interface Segregation
- `UsuarioRepository` expone solo los métodos necesarios: `findByEmail`, `findById`, `create`.
### D — Dependency Inversion
- `AuthService` depende de `UsuarioRepository` (abstracción) inyectada desde `routes/auth.js`.
- El controlador depende del servicio, no de la implementación de datos.
---
 
##  Rutas del sistema
 
### Autenticación (pública)
 
| Método | Ruta | Acción |
|---|---|---|
| GET | `/auth/login` | Muestra formulario de login y registro |
| POST | `/auth/login` | Procesa el login |
| POST | `/auth/signup` | Registra un nuevo usuario |
| POST | `/auth/logout` | Cierra la sesión |
| GET | `/auth/recuperar` | Formulario recuperar contraseña (demo) |
| POST | `/auth/recuperar` | Procesa recuperación (demo) |
 
### Panel del Director Técnico (protegida)
 
| Método | Ruta | Acción |
|---|---|---|
| GET | `/panel` | Dashboard con KPIs, lotes activos y bitácora |
 
### Lotes de producción (protegidas)
 
| Método | Ruta | Acción |
|---|---|---|
| GET | `/lotes` | Listado de lotes activos con filtros |
| GET | `/lotes/nuevo` | Formulario nueva orden de producción |
| POST | `/lotes/nuevo` | Crea un nuevo lote |
| GET | `/lotes/:id` | Detalle → redirige al paso actual del lote |
| GET | `/lotes/:id/paso/:n` | Vista del paso N (1–9) del proceso |
| POST | `/lotes/:id/paso/:n/avanzar` | Avanza al siguiente paso |
 
### No conformidades (protegida)
 
| Método | Ruta | Acción |
|---|---|---|
| GET | `/noconformidad/nueva` | Formulario de registro de no conformidad |
| POST | `/noconformidad` | Procesa y guarda la no conformidad |
 
---
 
##  Proceso productivo — 9 pasos
 
Cada lote recorre un flujo de 9 pasos secuenciales:
 
| Paso | Nombre | Descripción |
|---|---|---|
| 1 | Recepción de la orden | Verificación de la orden de producción física |
| 2 | Traslado de materias primas | Confirmación de recepción de materiales en laboratorio |
| 3 | Verificación de pesos | Control de pesaje de materias primas vs. fórmula |
| 4 | Instructivo de manufactura | Ejecución paso a paso del proceso de mezcla |
| 5 | Controles de calidad | Análisis de parámetros físicoquímicos del granulado |
| 6 | Retiro de marmita | Registro de cantidad obtenida y rendimiento |
| 7 | Empaque y tapado | Control de línea de empaque por muestreo |
| 8 | Área de acondicionamiento | Verificación de condiciones ambientales BPM |
| 9 | Etiquetado | Verificación del contenido de la etiqueta final |
 
---
 
## 🔌 Cambiar a base de datos real
 
Solo necesitas crear una nueva implementación del repositorio:
 
```js
// src/repositories/MongoUsuarioRepository.js
class MongoUsuarioRepository {
  async findByEmail(email) { /* db.collection('usuarios').findOne({ email }) */ }
  async findById(id)       { /* db.collection('usuarios').findOne({ _id: id }) */ }
  async create(data)       { /* db.collection('usuarios').insertOne(data) */ }
}
```
 
Y cambiar en `routes/auth.js`:
```js
// const usuarioRepo = new UsuarioRepository();          // in-memory
const usuarioRepo = new MongoUsuarioRepository();        // MongoDB
```
 
El resto de la aplicación no cambia. 
 
---
 
##  Problemas comunes y soluciones
 
### Error: `Cannot find module '../service/AuthService'`
La carpeta se llama `service` (sin "s"). Verifica que el import use la ruta exacta:
```js
const AuthService = require('../service/AuthService');
```
 
### Error: `router.js` usa `import/export` (ESM) en vez de `require`
El archivo `src/routes/router.js` tiene sintaxis ESM (`import`, `export default`) pero el proyecto es CommonJS. Cambia a:
```js
const { Router } = require('express');
// ... resto del código
module.exports = router;
```
 
### La sesión se pierde al reiniciar el servidor
Los datos están en memoria. Es el comportamiento esperado en modo desarrollo. En producción, conectar a un store externo (Redis, MongoDB).
 
### Error 500 al intentar acceder a `/lotes/:id` con un ID inválido
El controlador busca el lote por `parseInt(req.params.id)`. Si el ID no es numérico (como los del panel mock `'LT-2024-089'`), no encontrará el lote. Los lotes del panel (`PanelController`) y los del módulo de lotes (`LoteController`) son arrays de datos separados con formatos de ID distintos.
 
### `errorHandler` está definido dos veces en `errorHandler.js`
Solo se exporta la segunda definición (la que incluye `fechaHoy` y `usuario`). La primera definición queda sin efecto. Para limpiar el código, elimina la primera función duplicada.
 
---
 
##  Dependencias
 
| Paquete | Uso |
|---|---|
| `express` | Framework web principal |
| `ejs` | Motor de plantillas HTML |
| `express-ejs-layouts` | Sistema de layouts compartidos |
| `express-session` | Manejo de sesiones HTTP |
| `connect-flash` | Mensajes flash entre redirecciones |
| `method-override` | PUT/DELETE desde formularios HTML |
| `morgan` | Logger HTTP de peticiones |
| `uuid` | Generación de IDs únicos para usuarios |
| `nodemon` | Hot-reload en desarrollo |
| `jest` | Framework de testing |
 
