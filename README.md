# Korpia Analytics Platform

Plataforma de dashboards KPI multi-empresa. Backend en Node.js + Prisma (SQLite) y frontend en Next.js 15 con Tailwind CSS.

---

## Requisitos previos

| Herramienta | Version minima |
|-------------|----------------|
| Node.js     | 20.19 / 22.x / 24.x |
| npm         | 9+ |
| Git         | cualquier version reciente |

> Si tu version de Node es anterior a la requerida, instala [nvm](https://github.com/nvm-sh/nvm) y ejecuta:
> ```bash
> nvm install 22
> nvm use 22
> ```

---

## Estructura del proyecto

```
Korpia/
├── server.js              # Servidor Express (backend)
├── package.json           # Scripts y dependencias del backend
├── prisma/
│   ├── schema.prisma      # Esquema de base de datos
│   └── migrations/        # Migraciones SQLite
├── src/
│   ├── database/
│   │   ├── db.js
│   │   ├── prismaClient.js
│   │   └── seed.js        # Script para poblar la BD
│   └── routes/
│       ├── auth.js
│       ├── kpis.js
│       ├── query.js
│       └── upload.js
└── frontend/              # Aplicacion Next.js
    ├── app/
    │   ├── login/         # Pantalla de login
    │   └── dashboard/     # Dashboards por seccion
    ├── components/
    │   ├── DashboardHeader.tsx
    │   ├── Sidebar.tsx
    │   └── dashboard/     # Componentes KPI (Cards, Charts)
    └── lib/
        ├── appContext.tsx  # Estado global (auth, empresa)
        ├── kpiData.ts      # Datos KPI por empresa
        └── kpiHelpers.ts   # Utilidades de calculo
```

---

## Instalacion

### 1. Clonar el repositorio

```bash
git clone https://github.com/Skapsis/Korpia.git
cd Korpia
```

### 2. Instalar dependencias del backend

```bash
npm install
```

### 3. Instalar dependencias del frontend

```bash
cd frontend
npm install
cd ..
```

### 4. Configurar variables de entorno

Crea un archivo `.env` en la raiz del proyecto:

```env
PORT=3000
JWT_SECRET=tu_clave_secreta_aqui
DATABASE_URL="file:./prisma/dev.db"
```

### 5. Inicializar la base de datos

```bash
# Generar el cliente Prisma
npx prisma generate

# Ejecutar migraciones (crea dev.db)
npx prisma migrate dev --name init

# Poblar con datos iniciales
npm run seed
```

El seed crea:
- Empresa: **SOLVEX**
- Usuario administrador: `admin@solvex.com`

---

## Ejecucion

### Modo desarrollo (backend + frontend simultaneos)

```bash
npm run dev
```

Esto levanta en paralelo:
- **Backend** → `http://localhost:3000`
- **Frontend** → `http://localhost:3001` (o 3000 si esta libre)

### Solo backend

```bash
npm run dev:backend
# o en produccion:
npm start
```

### Solo frontend

```bash
npm run dev:frontend
# equivalente a:
cd frontend && npm run dev
```

---

## Acceso a la aplicacion

1. Abre `http://localhost:3001` en el navegador
2. En la pantalla de login selecciona una empresa del listado
3. Ingresa cualquier usuario y contrasena (login simulado, sin validacion de backend por ahora)
4. Accederas al dashboard correspondiente a la empresa seleccionada

### Empresas disponibles

| Empresa   | Descripcion                  |
|-----------|------------------------------|
| SOLVEX    | Datos reales de la empresa   |
| EL MEJOR  | Segunda empresa multi-tenant |

---

## Navegacion del dashboard

| Ruta                       | Seccion           |
|----------------------------|-------------------|
| `/dashboard`               | Resumen General   |
| `/dashboard/comercial`     | KPIs Comerciales  |
| `/dashboard/operaciones`   | KPIs Operaciones  |
| `/dashboard/calidad`       | Calidad Tecnica   |
| `/dashboard/upload`        | Carga de datos    |

### Patron Maestro-Detalle

Cada seccion muestra tarjetas resumidas. Al hacer clic en una tarjeta se abre la vista detalle con:
- Resumen de totales (Logrado / Meta / Cumplimiento)
- Grafico de barras por semana
- Tabla detallada semana a semana

---

## Scripts disponibles

| Comando             | Descripcion                                     |
|---------------------|-------------------------------------------------|
| `npm run dev`       | Inicia backend y frontend en paralelo           |
| `npm run dev:backend` | Solo el servidor Express                      |
| `npm run dev:frontend` | Solo Next.js                                 |
| `npm start`         | Inicia el backend en modo produccion            |
| `npm run seed`      | Puebla la base de datos con datos iniciales     |
| `npx prisma studio` | Abre el explorador visual de la base de datos   |
| `npx prisma migrate dev` | Aplica nuevas migraciones                  |

---

## Tecnologias utilizadas

**Backend**
- Node.js + Express 5
- Prisma ORM 7 + SQLite (`better-sqlite3`)
- JWT para autenticacion
- Multer para carga de archivos

**Frontend**
- Next.js 15 (App Router, Turbopack)
- TypeScript
- Tailwind CSS v4
- Recharts (graficos)
- Lucide React (iconos)
- React Hot Toast (notificaciones)

---

## Solucion de problemas comunes

### Error: "Prisma requires Node.js >= 20.19"

```bash
nvm install 22
nvm use 22
```

### Puerto 3000 ocupado

El frontend se movera automaticamente al puerto 3001. Si necesitas cambiarlo edita `frontend/package.json`:

```json
"dev": "next dev --port 3002"
```

### Error al generar Prisma Client

```bash
npx prisma generate
npx prisma migrate reset
npm run seed
```

### `concurrently` no encontrado

```bash
npm install --save-dev concurrently
```

---

## Contribuir

1. Crea una rama: `git checkout -b feature/mi-feature`
2. Haz tus cambios y commit: `git commit -m "feat: descripcion"`
3. Push: `git push origin feature/mi-feature`
4. Abre un Pull Request en GitHub

---

*Korpia Analytics Platform — 2026*
