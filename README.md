# Truex Trade Backend

Backend API para la plataforma Truex Trade desarrollado con **Node.js**, **Express** y **Mongoose** (MongoDB).

## 🚀 Requisitos Previos

- [Node.js](https://nodejs.org/) (versión 18 o superior)
- Conexión a MongoDB (Cluster Atlas o local)

---

## 📦 Instalación

1. Clona el repositorio y navega a la carpeta del proyecto:
   ```bash
   cd truex-trade-backend
   ```

2. Instala las dependencias:
   ```bash
   npm install
   ```

---

## ⚙️ Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto (o utiliza como referencia el archivo [`.env.example`](file:///c:/Users/USUARIO/Desktop/truex/truex-trade-backend/.env.example)):

```env
PORT=5000
MONGODB_URI=mongodb+srv://<usuario>:<password>@cluster0.r79rn7k.mongodb.net/truex?appName=Cluster0
FRONTEND_URL=https://truextrade.vercel.app
```

---

## 🛠️ Scripts Disponibles

- **Modo Desarrollo (con recarga automática):**
  ```bash
  npm run dev
  ```
- **Modo Producción:**
  ```bash
  npm start
  ```

---

## 📁 Estructura del Proyecto

```text
truex-trade-backend/
├── src/
│   ├── config/
│   │   └── db.js            # Conexión a MongoDB con Mongoose
│   ├── controllers/         # Controladores de lógica de negocio
│   ├── middlewares/         # Middlewares personalizados (auth, validaciones)
│   ├── models/              # Modelos y esquemas de Mongoose
│   ├── routes/              # Definición de rutas Express
│   ├── app.js               # Configuración de Express, CORS y middlewares base
│   └── server.js            # Punto de entrada y levantamiento del servidor HTTP
├── .env                     # Variables de entorno locales (ignorado por Git)
├── .env.example             # Plantilla de variables de entorno
├── .gitignore
├── package.json
└── README.md
```

---

## 🌐 Endpoints Iniciales

- `GET /` - Verifica que el backend esté operativo.
- `GET /api/health` - Estado de salud del servicio (uptime y timestamp).
