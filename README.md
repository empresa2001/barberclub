# BarberClub - Gestión de Barberías PWA

Una aplicación web progresiva (PWA) moderna para la gestión integral de barberías, construida con Next.js, TypeScript, Tailwind CSS y Supabase.

## 🚀 Características

### 📱 Progressive Web App (PWA)
- Instalable en dispositivos móviles
- Funciona sin conexión
- Notificaciones push
- Experiencia nativa

### 👥 Gestión Multi-Tenante
- **Superadmin**: Control total de la plataforma
- **Barbershop Admin**: Gestión de su barbería
- **Barbero**: Acceso a su agenda personal
- **Cliente**: Reservas sin necesidad de cuenta

### 🛠️ Funcionalidades Principales
- ✅ Sistema de turnos inteligente
- ✅ Gestión de barberos y servicios
- ✅ Horarios y disponibilidad
- ✅ Notificaciones por WhatsApp
- ✅ Panel de administración completo
- ✅ Diseño responsive y moderno

## 🎨 Diseño

### Paleta de Colores
- **Negro**: `#1a1a1a` - Elegancia y profesionalismo
- **Rojo**: `#b02e2e` - Acento tradicional de barbería
- **Azul**: `#2e4a7d` - Confianza y profesionalismo
- **Blanco**: `#ffffff` - Limpieza y contraste
- **Gris Claro**: `#f2f2f2` - Suavidad y balance

### Tipografía
- **Poppins**: Font principal para toda la aplicación
- Pesos: 300, 400, 500, 600, 700

## 🛠️ Stack Tecnológico

### Frontend
- **Next.js 15**: Framework de React con App Router
- **TypeScript**: Tipado estático
- **Tailwind CSS**: Framework de utilidades CSS
- **Lucide React**: Iconografía moderna

### Backend
- **Supabase**: Base de datos PostgreSQL
- **Supabase Auth**: Autenticación y autorización
- **Row Level Security (RLS)**: Seguridad a nivel de fila

### PWA
- **Service Worker**: Cacheo y funcionalidad offline
- **Web App Manifest**: Configuración de instalación
- **Push Notifications**: Notificaciones nativas

## 📦 Instalación

1. **Clonar el repositorio**
```bash
git clone https://github.com/tu-usuario/barberclub.git
cd barberclub
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
```bash
cp .env.local.example .env.local
```

Editar `.env.local` con tus credenciales de Supabase:
```env
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anonima_de_supabase
```

4. **Configurar la base de datos**
```bash
# Ejecutar en Supabase SQL Editor
# 1. Ejecutar supabase/schema.sql
# 2. Ejecutar supabase/rls-policies.sql
```

5. **Ejecutar en desarrollo**
```bash
npm run dev
```

## 🗄️ Estructura del Proyecto

```
barberclub/
├── public/
│   ├── manifest.json          # Configuración PWA
│   ├── sw.js                  # Service Worker
│   ├── offline.html           # Página offline
│   └── icons/                 # Iconos PWA
├── src/
│   ├── app/                   # App Router de Next.js
│   │   ├── globals.css        # Estilos globales
│   │   ├── layout.tsx         # Layout principal
│   │   └── page.tsx           # Página de inicio
│   ├── components/            # Componentes reutilizables
│   │   ├── ui/               # Componentes UI base
│   │   ├── forms/            # Formularios
│   │   └── layout/           # Componentes de layout
│   ├── lib/                   # Utilidades y configuraciones
│   │   ├── supabase.ts       # Cliente de Supabase
│   │   └── utils.ts          # Funciones auxiliares
│   └── types/                 # Definiciones TypeScript
├── supabase/
│   ├── schema.sql            # Esquema de base de datos
│   └── rls-policies.sql      # Políticas de seguridad
├── tailwind.config.ts        # Configuración Tailwind
└── next.config.ts            # Configuración Next.js
```

## 🔐 Seguridad

### Row Level Security (RLS)
- Implementado en todas las tablas
- Políticas específicas por rol de usuario
- Aislamiento completo de datos por barbería

### Roles de Usuario
- **superadmin**: Acceso total
- **barbershop_admin**: Solo su barbería
- **barber**: Solo su información y agenda
- **customer**: Sin autenticación (solo reservas)

## 🗃️ Base de Datos

### Tablas Principales
- `users`: Usuarios con autenticación
- `barbershops`: Información de barberías
- `services`: Servicios y precios
- `barbers`: Barberos y sus datos
- `availability`: Horarios disponibles
- `appointments`: Turnos agendados
- `notifications`: Historial de mensajes

### Características
- Triggers automáticos para `updated_at`
- Validación de disponibilidad
- Índices optimizados para rendimiento
- Datos de ejemplo incluidos

---

**Desarrollado con ❤️ para la comunidad de barberos profesionales**
