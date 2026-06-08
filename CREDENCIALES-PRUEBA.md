# Credenciales de prueba — BarberClub

> ⚠️ **Solo para testing.** No usar estas cuentas en un entorno real con datos sensibles.
> Cambiá las contraseñas antes de pasar a un uso productivo serio.

App en producción: **https://barberclub-zeta.vercel.app**

---

## 🔑 Cuentas

### Super Admin
Acceso al panel global (`/admin`): gestiona todas las barberías, las activa/desactiva.

| Campo | Valor |
|-------|-------|
| Email | `francododera@hotmail.com` |
| Password | `SuperAdmin123!` |
| Rol a elegir en el login | **Superadmin** |
| Redirige a | `/admin` |

> Tu otra cuenta superadmin (`franco.dodera@klgsa.com`) sigue activa con tu contraseña personal.

### Administrador de barbería (dueño)
Gestiona su propia barbería: barberos, servicios, horarios y turnos.

| Campo | Valor |
|-------|-------|
| Email | `owner.test@barberclub.test` |
| Password | `Prueba123!` |
| Rol a elegir en el login | **Administrador de barbería** |
| Redirige a | `/adminBarber/{id de su barbería}` |

### Barbero
Ve su agenda y sus turnos asignados.

| Campo | Valor |
|-------|-------|
| Email | `barbero.test@barberclub.test` |
| Password | `Prueba123!` |
| Rol a elegir en el login | **Barbero** |
| Redirige a | `/barberBook` |

---

## 🏪 Barbería de prueba ya cargada

- **Nombre:** Barbería de Prueba
- **Estado:** Activa (visible en el booking público)
- **Dueño:** `owner.test@barberclub.test`
- **Barbero:** Carlos Barbero (`barbero.test@barberclub.test`)
- **Servicios:**
  - Corte Clásico — $3.500 — 30 min
  - Corte + Barba — $5.500 — 45 min
- **Horarios del barbero:** Lunes a Viernes, 09:00 a 18:00

---

## 🧪 Cómo probar el sistema

### 1. Reservar un turno (booking público — sin login)
1. Entrá a **https://barberclub-zeta.vercel.app/book**
2. Seleccioná **Barbería de Prueba** → **Carlos Barbero** → un servicio
3. Elegí una **fecha de lunes a viernes** (hay horarios solo esos días)
4. Elegí un horario disponible, completá nombre/email/teléfono y confirmá
5. Deberías ver el toast de confirmación ✅

> Nota: dos turnos del mismo barbero no pueden solaparse (lo impide la base de datos).

### 2. Panel del dueño
1. **https://barberclub-zeta.vercel.app/login**
2. Email/password del **dueño**, rol **Administrador de barbería**
3. Ahí gestionás barberos, servicios, horarios y ves los turnos.

### 3. Vista del barbero
1. Login con la cuenta de **barbero**, rol **Barbero**
2. Ves tu agenda en `/barberBook`.

### 4. Panel de superadmin
1. Login con la cuenta de **superadmin**, rol **Superadmin**
2. Gestionás todas las barberías (activar/desactivar, etc.).

---

## 📝 Notas

- El **rol elegido en el login** debe coincidir con el tipo de la cuenta, si no, no deja entrar.
- Las barberías nuevas que se registran desde `/register` arrancan en estado **pendiente**;
  un superadmin debe **activarlas** para que aparezcan en el booking público.
- Estas contraseñas se pueden cambiar desde Supabase → Authentication → Users.
