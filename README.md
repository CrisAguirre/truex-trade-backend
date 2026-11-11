# Truex Trade Backend

Backend API para la plataforma Truex Trade desarrollado con **Node.js**, **Express** y **Mongoose** (MongoDB).

## Requisitos

- [Node.js](https://nodejs.org/) 18 o superior
- MongoDB (Atlas o local)

## Instalación

```bash
npm install
```

---

## ⚙️ Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto usando [`.env.example`](.env.example) como referencia:

```env
PORT=5000
MONGODB_URI=mongodb+srv://<usuario>:<password>@cluster0.r79rn7k.mongodb.net/truex?appName=Cluster0
FRONTEND_URL=https://truextrade.vercel.app
FRONTEND_URLS=http://localhost:5173,http://localhost:5174
JWT_SECRET=una_cadena_larga_y_aleatoria
JWT_EXPIRES_IN=7d

ADMIN_NOMBRE=Administrador TrueX
ADMIN_USERNAME=admin
ADMIN_EMAIL=admin@truex.app
ADMIN_PASSWORD=Admin1234
ADMIN_UBICACION=Pasto, Nariño
```

> El servidor no arranca si faltan `MONGODB_URI` o `JWT_SECRET`.

---

## 🛠️ Scripts

- **Modo desarrollo (con recarga automática):**
  ```bash
  npm run dev
  ```
- **Modo producción:**
  ```bash
  npm start
  ```
- **Crear/actualizar el usuario administrador:**
  ```bash
  npm run seed:admin
  ```
  Usa las variables `ADMIN_*` del `.env`. Si el correo ya existe, actualiza sus datos, su contraseña y lo marca como `admin` y `verificado`.

## Estructura

```text
truex-trade-backend/
├── src/
│   ├── config/
│   │   └── db.js                  # Conexión a MongoDB
│   ├── controllers/
│   │   ├── admin.controller.js    # Gestión de usuarios y métricas
│   │   ├── auth.controller.js     # Registro, login y perfil
│   │   ├── categories.controller.js
│   │   ├── intercambios.controller.js
│   │   ├── items.controller.js
│   │   ├── messages.controller.js
│   │   ├── notifications.controller.js
│   │   ├── stats.controller.js
│   │   └── users.controller.js
│   ├── middlewares/
│   │   └── auth.middleware.js     # JWT, roles y autenticación opcional
│   ├── models/
│   │   ├── Intercambio.js
│   │   ├── Item.js
│   │   ├── Mensaje.js
│   │   ├── Notificacion.js
│   │   └── Usuario.js
│   ├── routes/                    # Rutas /api/*
│   ├── scripts/
│   │   └── seedAdmin.js           # Semilla del administrador
│   ├── utils/
│   │   ├── constants.js
│   │   └── serializers.js
│   ├── app.js
│   └── server.js
├── .env.example
├── package.json
└── README.md
```

## 🌐 Endpoints

### Salud

| Método | Endpoint | Acceso |
| ------ | -------- | ------ |
| `GET` | `/` | Público |
| `GET` | `/api/health` | Público |

### Autenticación

| Método | Endpoint | Descripción | Acceso |
| ------ | -------- | ----------- | ------ |
| `POST` | `/api/auth/register` | Crea la cuenta y devuelve JWT | Público |
| `POST` | `/api/auth/login` | Inicia sesión y devuelve JWT | Público |
| `GET` | `/api/auth/me` | Perfil del usuario autenticado | Bearer |

### Artículos

| Método | Endpoint | Descripción | Acceso |
| ------ | -------- | ----------- | ------ |
| `GET` | `/api/items` | Lista con `buscar`, `categoria`, `tipo`, `ubicacion`, `pagina`, `limite`, `orden` | Público |
| `GET` | `/api/items/:id` | Detalle del artículo | Público |
| `GET` | `/api/items/user/:userId` | Artículos de un usuario | Público |
| `GET` | `/api/items/favoritos` | Favoritos del usuario | Bearer |
| `POST` | `/api/items` | Publica un artículo | Bearer |
| `PUT` | `/api/items/:id` | Edita (propietario o admin) | Bearer |
| `DELETE` | `/api/items/:id` | Elimina lógicamente (propietario o admin) | Bearer |
| `POST` | `/api/items/:id/favorite` | Alterna favorito | Bearer |

### Categorías y estadísticas

| Método | Endpoint | Descripción | Acceso |
| ------ | -------- | ----------- | ------ |
| `GET` | `/api/categories` | Categorías con id, nombre e ícono | Público |
| `GET` | `/api/stats` | Usuarios, publicaciones, intercambios y calificación promedio | Público |

### Usuarios

| Método | Endpoint | Descripción | Acceso |
| ------ | -------- | ----------- | ------ |
| `GET` | `/api/users/:id` | Perfil público | Público |
| `PATCH` | `/api/users/me` | Actualiza nombre, username, ubicación o avatar | Bearer |

### Mensajes

| Método | Endpoint | Descripción | Acceso |
| ------ | -------- | ----------- | ------ |
| `GET` | `/api/messages` | Conversaciones con último mensaje y no leídos | Bearer |
| `GET` | `/api/messages/:usuarioId` | Historial y marcado como leído | Bearer |
| `POST` | `/api/messages/:usuarioId` | Envía un mensaje | Bearer |

### Notificaciones

| Método | Endpoint | Descripción | Acceso |
| ------ | -------- | ----------- | ------ |
| `GET` | `/api/notifications` | Últimas 50 y contador de no leídas | Bearer |
| `PATCH` | `/api/notifications/leer-todas` | Marca todas como leídas | Bearer |
| `PATCH` | `/api/notifications/:id/leer` | Marca una como leída | Bearer |
| `DELETE` | `/api/notifications/:id` | Elimina una notificación | Bearer |

### Intercambios

| Método | Endpoint | Descripción | Acceso |
| ------ | -------- | ----------- | ------ |
| `GET` | `/api/intercambios` | Intercambios del usuario | Bearer |
| `POST` | `/api/intercambios` | Propone un trueque | Bearer |
| `PATCH` | `/api/intercambios/:id/estado` | Acepta, rechaza, cancela o completa | Bearer |

### Administración

| Método | Endpoint | Descripción | Acceso |
| ------ | -------- | ----------- | ------ |
| `GET` | `/api/admin/usuarios` | Lista con `buscar`, `rol`, `pagina`, `limite` | Admin |
| `PATCH` | `/api/admin/usuarios/:id/rol` | Cambia entre `usuario` y `admin` | Admin |
| `DELETE` | `/api/admin/usuarios/:id` | Elimina usuario y desactiva sus artículos | Admin |
| `GET` | `/api/admin/estadisticas` | Métricas generales | Admin |

---

## 🔐 Autenticación y roles

Los endpoints protegidos esperan:

```http
Authorization: Bearer <jwt>
```

El token incluye el `sub` del usuario. El rol (`usuario` o `admin`) se consulta siempre desde la base de datos, no desde el token. Los errores usan `{ "mensaje": "..." }` y, cuando aplica, `{ "errores": { campo: "..." } }`.

### Ejemplo de registro

```json
{
  "nombre": "David Garcia",
  "username": "davidgx",
  "email": "demo@truex.app",
  "password": "truex1234",
  "ubicacion": "Pasto, Nariño"
}
```

### Ejemplo de publicación

```json
{
  "titulo": "Bicicleta de montaña",
  "descripcion": "Rodado 29, poco uso. Busco cambio por consola.",
  "categoria": "Deportes",
  "estado": "Buen estado",
  "tipo": "trueque",
  "ubicacion": "Pasto, Nariño",
  "imagenes": ["https://ejemplo.com/bicicleta.jpg"]
}
```

> Las imágenes se aceptan como URLs o data URLs. El límite del cuerpo es de 16 MB y se permiten hasta 4 imágenes por artículo.

### Ejemplo de propuesta de trueque

```json
{
  "articuloId": "<id del artículo deseado>",
  "articuloOfrecidoId": "<id de un artículo propio, opcional>",
  "mensaje": "Me interesa, te ofrezco mi guitarra."
}
```

---

## 🔌 Conexión con el frontend

En `TruexTradeFronted` crea un archivo `.env` con:

```env
VITE_API_URL=http://localhost:5000/api
```

Sin esa variable el frontend usa sus mocks locales de `localStorage`.

---

## 🧪 Verificación rápida

```bash
# Sintaxis de todos los archivos
Get-ChildItem -Recurse src -Filter *.js | ForEach-Object { node --check $_.FullName }

# Crear el administrador
npm run seed:admin

# Levantar el servidor
npm run dev
```
