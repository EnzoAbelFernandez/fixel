# Fixcel - Frontend

Interfaz web para el sistema de ventas e inventario Fixcel.

## Requisitos

- Node.js 18+
- Backend corriendo en `http://localhost:5000`

## Desarrollo

```bash
# Instalar dependencias (si aún no)
npm install

# Iniciar el frontend (puerto 3000)
npm run dev
```

El frontend usa un proxy hacia el backend, así que las peticiones a `/api` se redirigen automáticamente a `localhost:5000`.

## Credenciales demo

- **Email:** admin@fixel.local  
- **Contraseña:** admin123  

(Asegúrate de ejecutar `node scripts/seed.js` en el backend para crear el usuario admin)

## Build

```bash
npm run build
```

Los archivos se generan en `dist/`.
