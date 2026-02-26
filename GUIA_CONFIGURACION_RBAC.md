# 🚀 Sistema de Configuración Dinámica y RBAC

## 📋 Descripción General

Tu aplicación ahora es una **plataforma basada en configuraciones (Configuration-Driven UI)** con un sistema avanzado de permisos **RBAC (Role-Based Access Control)**.

## 🎯 Características Implementadas

### 1. **Admin Launcher** - Panel de Configuración Global

**Ruta:** `/dashboard/launcher` (Solo SuperAdmin)

El Admin Launcher permite:

- ✅ **Activar/Desactivar menús completos** en tiempo real
- ✅ **Cambiar nombres de KPIs** sin tocar código
- ✅ **Modificar metas y objetivos** de cada indicador
- ✅ **Personalizar colores y tipos de gráfico**
- ✅ **Ajustar rol mínimo** requerido para cada menú

#### Cómo usar:

1. Inicia sesión como SuperAdmin
2. Navega a **"🚀 Admin Launcher"** en el menú lateral
3. En la pestaña **"Gestión de Menús"**:
   - Toggle activar/desactivar menús
   - Editar nombre, icono y rol mínimo
   - Guardar cambios

4. En la pestaña **"Configuración de KPIs"**:
   - Filtrar por área (Comercial, Operaciones, Calidad)
   - Editar nombre, meta, unidad y color
   - Los cambios se reflejan inmediatamente

### 2. **Sistema RBAC** - Roles y Permisos

Se implementaron 3 niveles de acceso:

#### 🔴 **Visualizador (viewer)**
- ✅ Ver dashboards asignados
- ❌ No puede editar configuraciones
- ❌ No puede cargar datos

#### 🟠 **Gerente de Área (gerente)**
- ✅ Ver dashboards de su área específica
- ✅ Editar KPIs de su área
- ✅ Cargar datos (CSV)
- ❌ No acceso al Admin Launcher

#### 🟢 **Super Administrador (superadmin)**
- ✅ Acceso total a todos los dashboards
- ✅ Gestión completa del Admin Launcher
- ✅ Crear/editar menús y KPIs
- ✅ Ver datos de todas las empresas

### 3. **Menú Dinámico** - Basado en Permisos

El **Sidebar** (menú lateral) ya no es estático. Ahora:

- 🔄 Se carga dinámicamente desde la configuración
- 🔒 Filtra automáticamente según el rol del usuario
- 🎨 Los menús sin permisos NO aparecen
- ⚡ Se actualiza en tiempo real

#### Ejemplo:

```javascript
// Usuario con rol "viewer" solo verá:
- Dashboard General
- Comercial (si tiene acceso)
- Operaciones (si tiene acceso)
- Calidad (si tiene acceso)

// Usuario "gerente" verá además:
- Carga de Datos

// Usuario "superadmin" verá TODOS más:
- Configuración KPIs
- Admin Launcher
```

### 4. **Sincronización Global** - Estado Reactivo

Se implementó un **Context Global** que:

- 💾 Guarda estado en `localStorage`
- 🔄 Sincroniza permisos entre tabs
- ⚡ Reactiva automáticamente ante cambios
- 🌐 Refresca configuración al cambiar de pestaña

## 🗄️ Estructura de Base de Datos

### Nuevas Tablas

#### `AppConfiguration`
Configuración global de la aplicación
- `name`: Identificador único (ej: "global", "solvex")
- `config`: JSON con configuraciones
- `active`: Estado activo/inactivo

#### `MenuConfiguration`
Definición de menús del sistema
- `menuKey`: ID único del menú
- `label`: Nombre visible
- `path`: Ruta URL
- `icon`: Emoji o icono
- `enabled`: Activado/desactivado
- `minRole`: Rol mínimo requerido

#### `KPIConfiguration`
Configuración de indicadores
- `area`: Área (comercial, operaciones, calidad)
- `kpiKey`: ID único del KPI
- `displayName`: Nombre visible
- `goal`: Meta u objetivo
- `unit`: Unidad (%, $, #)
- `chartType`: Tipo de gráfico (bar, line, gauge)
- `color`: Color en HEX

#### `Role`
Definición de roles del sistema
- `name`: Nombre técnico
- `displayName`: Nombre visible
- `permissions`: Array JSON de permisos
- `level`: Nivel jerárquico (0-2)

### Modificación en `User`
- **Nueva columna:** `areas` (JSON array)
  - Ejemplo: `["comercial", "operaciones"]`
  - Define a qué áreas tiene acceso el usuario

## 🔧 API Endpoints

### Configuración

#### `GET /api/configuration`
Obtener configuración global
```bash
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:3000/api/configuration?name=global
```

#### `PUT /api/configuration`
Actualizar configuración (SuperAdmin)
```bash
curl -X PUT -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"global","config":{...}}' \
  http://localhost:3000/api/configuration
```

### Menús

#### `GET /api/configuration/menus`
Obtener menús filtrados por permisos
```bash
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:3000/api/configuration/menus
```

#### `PUT /api/configuration/menus/:id`
Actualizar menú (SuperAdmin)
```bash
curl -X PUT -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"label":"Nuevo Nombre","enabled":true}' \
  http://localhost:3000/api/configuration/menus/menu_1
```

### KPIs

#### `GET /api/configuration/kpis?area=comercial`
Obtener KPIs de un área
```bash
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:3000/api/configuration/kpis?area=comercial
```

#### `PUT /api/configuration/kpis/:id`
Actualizar KPI (SuperAdmin/Gerente)
```bash
curl -X PUT -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"displayName":"Nuevos Clientes","goal":150}' \
  http://localhost:3000/api/configuration/kpis/kpi_com_1
```

## 🚀 Instrucciones de Implementación

### 1. Ejecutar Migración

```bash
# Desde la raíz del proyecto
cd /Users/ivanvazquez/Korpia

# Aplicar migración
sqlite3 prisma/dev.db < prisma/migrations/20260226_add_configuration_rbac/migration.sql
```

### 2. Verificar Datos

```bash
# Ver menús creados
sqlite3 prisma/dev.db "SELECT * FROM MenuConfiguration;"

# Ver KPIs creados
sqlite3 prisma/dev.db "SELECT * FROM KPIConfiguration;"

# Ver roles
sqlite3 prisma/dev.db "SELECT * FROM Role;"
```

### 3. Actualizar Usuario de Prueba

```bash
# Dar permisos de SuperAdmin a un usuario
sqlite3 prisma/dev.db "UPDATE User SET role='superadmin', areas='[\"comercial\",\"operaciones\",\"calidad\"]' WHERE email='admin@solvex.com';"
```

### 4. Reiniciar Servidor Backend

```bash
# Terminal 1: Backend
cd /Users/ivanvazquez/Korpia
npm run dev  # o node server.js
```

### 5. Reiniciar Frontend

```bash
# Terminal 2: Frontend
cd /Users/ivanvazquez/Korpia/frontend
npm run dev
```

## 🧪 Probar el Sistema

### Escenario 1: Como SuperAdmin

1. **Login** con usuario superadmin
2. Ir a **Dashboard** → verás todos los menús
3. Ir a **Admin Launcher** → Probar:
   - Desactivar menú "Calidad"
   - Cambiar meta de "Potenciales" a 200
   - Guardar cambios
4. **Refrescar página** → Los cambios persisten

### Escenario 2: Como Gerente

1. **Login** con usuario gerente
2. Ir a **Dashboard** → verás solo menús de tu área
3. **No verás** "Admin Launcher" ni "Configuración"
4. Puedes ver/editar KPIs de tu área

### Escenario 3: Como Visualizador

1. **Login** con usuario viewer
2. Ir a **Dashboard** → solo lectura
3. **No verás**:
   - Admin Launcher
   - Configuración KPIs
   - Carga de Datos

## 🔄 Sincronización entre Clientes

Para ver cambios en tiempo real:

1. **Opción A:** Refrescar página (F5)
   - Los menús y KPIs se recargan automáticamente

2. **Opción B:** Implementar WebSockets (futuro)
   - Push notifications de cambios
   - Refresco automático sin F5

## 📊 Ejemplo de Flujo Completo

### Caso de Uso: Cambiar Meta de "Presupuestos"

1. **SuperAdmin** inicia sesión
2. Va a **Admin Launcher** → **KPIs**
3. Filtra por área "Comercial"
4. Click en **✏️ Editar** en "Presupuestos"
5. Cambia meta de 50 a 75
6. Click **✓ Guardar**
7. Va a **Dashboard Comercial**
8. El gráfico muestra nueva meta: 75

### Resultado:
- ✅ Sin reiniciar servidor
- ✅ Sin tocar código
- ✅ Cambio visible inmediatamente

## 🛠️ Personalización Avanzada

### Agregar Nuevo Menú

```bash
curl -X POST -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "menuKey": "presupuestos",
    "label": "Gestión de Presupuestos",
    "path": "/dashboard/presupuestos",
    "icon": "💼",
    "order": 5,
    "minRole": "gerente"
  }' \
  http://localhost:3000/api/configuration/menus
```

### Agregar Nuevo KPI

```bash
curl -X POST -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "area": "comercial",
    "kpiKey": "conversion",
    "displayName": "Tasa de Conversión",
    "goal": 25,
    "unit": "%",
    "chartType": "line",
    "color": "#8b5cf6",
    "order": 4
  }' \
  http://localhost:3000/api/configuration/kpis
```

## 🔐 Seguridad

### Protección de Rutas

Todas las rutas de configuración requieren:

1. **Token JWT válido**
2. **Rol autorizado** (SuperAdmin para la mayoría)
3. **Middleware de autenticación** en Backend

### Validación

- ✅ Tokens verificados con JWT
- ✅ Roles validados en cada request
- ✅ Permisos por área verificados
- ✅ CORS configurado para localhost

## 🎨 Personalizar Colores y Estilos

Los colores se configuran en formato HEX:

- **Azul:** `#3b82f6` (Comercial)
- **Verde:** `#10b981` (Calidad)
- **Naranja:** `#f59e0b` (Operaciones)
- **Púrpura:** `#8b5cf6` (Admin)
- **Rojo:** `#ef4444` (Alertas)

## 📝 Notas Importantes

1. **Migración de Datos:**
   - Los usuarios existentes necesitan actualizar su columna `areas`
   - Por defecto, `areas` es array vacío `[]`

2. **Compatibilidad:**
   - El sistema es retrocompatible
   - Si no hay configuración, usa valores por defecto

3. **Performance:**
   - Las configuraciones se cachean en el frontend
   - Refresh cada vez que se cambia de pestaña

4. **Multi-empresa:**
   - Cada empresa puede tener su configuración
   - SuperAdmin ve todas las empresas

## 🐛 Troubleshooting

### Error: "Token requerido"
- Verificar que estás enviando el header: `Authorization: Bearer TOKEN`

### Error: "Acceso denegado"
- Verificar rol del usuario en la BD
- Solo SuperAdmin puede acceder al Launcher

### Los menús no aparecen
- Verificar que la migración se ejecutó correctamente
- Revisar tabla `MenuConfiguration` en la BD

### Cambios no se reflejan
- Hacer hard refresh (Ctrl+Shift+R o Cmd+Shift+R)
- Limpiar localStorage

## 🚧 Próximos Pasos (Opcional)

1. **WebSockets para sync en tiempo real**
2. **Historial de cambios** (audit log)
3. **Export/Import** de configuraciones
4. **Themes personalizables**
5. **Multi-idioma dinámico**

---

## 📞 Soporte

Para dudas o issues:
- Revisar logs del servidor: `console`
- Verificar Network tab en DevTools
- Revisar estructura de BD con SQLite viewer

---

**¡Tu plataforma ahora es completamente configurable! 🎉**
