# Cómo iniciar Fixcel

El 404 en `/api/auth/login` suele ocurrir cuando **el backend no está corriendo**.

## Pasos (en este orden)

### 1. Terminal 1 - Backend
```bash
cd backend
npm run dev
```
Espera a ver: `MongoDB Conectado` y `Servidor corriendo en el puerto 5000`

### 2. Terminal 2 - Frontend
```bash
cd frontend
npm run dev
```
Espera a ver: `Local: http://localhost:3000`

### 3. Abrir en el navegador
**http://localhost:3000** (no uses preview ni archivos de `dist/`)

### 4. Si la base está vacía, ejecuta el seed
```bash
cd backend
node scripts/seed.js
```

---

**Importante:** El proxy de Vite solo funciona cuando usás `npm run dev` en el frontend. Si abrís `dist/index.html` o usás `npm run preview`, las peticiones a `/api` darán 404.
