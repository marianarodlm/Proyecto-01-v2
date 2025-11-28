# Proyecto 02 – Biblioteca API (Node.js + PostgreSQL + Docker)

Backend para una plataforma de biblioteca donde usuarios pueden registrarse, autenticarse, consultar libros, reservar libros y consultar historiales de reservas. Incluye permisos por usuario, soft delete, filtros + paginación, y pruebas por controlador (Jest + Supertest).

---

## Stack
- Node.js + Express
- PostgreSQL
- Docker / Docker Compose
- JWT (Autenticación)
- Jest + Supertest (Pruebas)

---

## Estructura del proyecto

```
FinalBackend/
src/
app.js
server.js
config/
db.js
controllers/
authController.js
userController.js
bookController.js
reservationController.js
middleware/
auth.js
errorHandler.js
routes/
authRoutes.js
userRoutes.js
bookRoutes.js
reservationRoutes.js
tests/
authController.test.js
userController.test.js
bookController.test.js
Dockerfile
docker-compose.yml
package.json
jest.config.js
.env.example
.gitignore
README.md
```

---

## Variables de entorno

Por seguridad, este repositorio **NO incluye** `.env`.  
Crea un archivo `.env` en la raíz (mismo nivel que `docker-compose.yml`) usando este ejemplo:

### `.env`
```env
PORT=3000
DATABASE_URL=postgres://postgres:postgres@db:5432/library
JWT_SECRET=change-me-to-a-long-secret

# Admin seed (se crea automáticamente al iniciar la API si no existe)
ADMIN_EMAIL=admin@lib.com
ADMIN_PASSWORD=Admin123
```

---

## Ejecutar con Docker (recomendado)

### 1) Construir y levantar API + DB

```bash
docker compose up --build
```

La API quedará en:

* `http://localhost:3000`

### 2) Levantar solo la DB (útil para correr tests localmente)

```bash
docker compose up -d db
```

### 3) Reiniciar desde cero (borra datos)

```bash
docker compose down -v
docker compose up --build
```

---

##  Admin automático (Seed)

Para que el profesor pueda probar endpoints con permisos (crear/editar/eliminar libros), el sistema crea automáticamente un **usuario admin** al iniciar la API (si no existe) usando:

* `ADMIN_EMAIL`
* `ADMIN_PASSWORD`

Por defecto:

* **admin@lib.com / Admin123**

El admin se crea con permisos:

* `can_create_books = true`
* `can_update_books = true`
* `can_delete_books = true`
* `can_update_users = true`
* `can_delete_users = true`

---

## Reglas de autenticación (según enunciado)

### Endpoints públicos (sin autenticación)

* `POST /api/auth/register` (CREATE usuario)
* `POST /api/auth/login` (login)
* `GET /api/books` (READ libros con filtros + paginación)
* `GET /api/books/:id` (READ libro específico)

### Endpoints protegidos (requieren JWT)

Todos los demás endpoints requieren header:

```
Authorization: Bearer <TOKEN>
```

---

## Endpoints

> Base URL local: `http://localhost:3000`

### Auth

* `POST /api/auth/register`
* `POST /api/auth/login`

### Users

* `GET /api/users/me` 
* `GET /api/users/:id`  *(seguro: no expone password_hash)*
* `PUT /api/users/:id`  (solo el mismo usuario o permiso `can_update_users`)
* `DELETE /api/users/:id` soft delete (solo el mismo usuario o permiso `can_delete_users`)

###  Books

* `GET /api/books` (público, filtros + paginación, excluye inactivos por defecto)
* `GET /api/books/:id` (público, retorna info completa del libro)
* `POST /api/books`  + permiso `can_create_books`
* `PUT /api/books/:id`  + permiso `can_update_books`
* `DELETE /api/books/:id`  + permiso `can_delete_books` (soft delete)

###  Reservations

* `POST /api/reservations`  (cualquier usuario autenticado puede reservar)
* `GET /api/reservations/book/:bookId`  (historial por libro)
* `GET /api/reservations/user/:userId`  (historial por usuario)

---

##  Filtros + paginación (GET /api/books)

Permite filtrar por cualquier combinación de:

* `genre`
* `published_at` (rango)
* `publisher`
* `author`
* `title`
* `available`
* `includeInactive` (para incluir soft deleted)

### Ejemplos

* `GET /api/books?page=1&pageSize=10`
* `GET /api/books?genre=Novela`
* `GET /api/books?author=Autor%201&publisher=Editorial%201`
* `GET /api/books?available=true`
* `GET /api/books?startDate=2010-01-01&endDate=2020-12-31`
* `GET /api/books?includeInactive=true`

### Respuesta esperada

* `items`: lista con **solo nombres de libros** (ej. `id` y `title`)
* `pagination`: `currentPage`, `totalPages`, `pageSize`, `totalItems`

---

## Soft Delete (seguridad)

* Usuarios y libros **no se eliminan físicamente**.
* Se marca `is_active = false`.
* Todos los READ excluyen inactivos por defecto.
* Se pueden incluir explícitamente usando `includeInactive=true` donde aplique.

---

##  Pruebas (Jest + Supertest)

El enunciado solicita:

* archivo de pruebas por controlador
* cada función probada en caso exitoso y fallo de validación

### Ejecutar tests (desde tu máquina)

1. Levanta DB en docker:

```bash
docker compose up -d db
```

2. Corre pruebas:

```bash
npm test
```

---

##  Guía de verificación en Postman (orden recomendado)

### 1) Login admin (obtener token)

**POST** `http://localhost:3000/api/auth/login`

```json
{
  "email": "admin@lib.com",
  "password": "Admin123"
}
```

### 2) Verificar token

**GET** `http://localhost:3000/api/users/me`
Header:

```
Authorization: Bearer <TOKEN_ADMIN>
```

### 3) Crear libros (admin)

**POST** `http://localhost:3000/api/books`
Headers:

```
Authorization: Bearer <TOKEN_ADMIN>
Content-Type: application/json
```

Body:

```json
{
  "title": "Libro 1",
  "author": "Autor 1",
  "genre": "Novela",
  "publisher": "Editorial 1",
  "published_at": "2020-01-01"
}
```

### 4) Leer libros (público)

* `GET http://localhost:3000/api/books?page=1&pageSize=10`
* `GET http://localhost:3000/api/books/1`

### 5) Crear usuario normal + login

**POST** `http://localhost:3000/api/auth/register`

```json
{ "name": "User Normal", "email": "user@lib.com", "password": "User123" }
```

**POST** `http://localhost:3000/api/auth/login`

```json
{ "email": "user@lib.com", "password": "User123" }
```

### 6) Validar permisos (user normal NO crea libro)

**POST** `http://localhost:3000/api/books` con `TOKEN_USER`
 esperado: `403 Forbidden`

### 7) Reservar libro (user normal)

**POST** `http://localhost:3000/api/reservations`
Header:

```
Authorization: Bearer <TOKEN_USER>
```

Body:

```json
{ "bookId": 1 }
```

### 8) Historiales (auth)

* `GET http://localhost:3000/api/reservations/book/1` (incluye nombre del usuario, fecha reserva, fecha entrega)
* `GET http://localhost:3000/api/reservations/user/<userId>` (incluye nombre del libro, fecha reserva, fecha entrega)

### 9) Soft delete libro (admin)

**DELETE** `http://localhost:3000/api/books/1` con `TOKEN_ADMIN`
Luego:

* `GET /api/books/1` → `404`
* `GET /api/books/1?includeInactive=true` → `200`

