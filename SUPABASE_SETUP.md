# BarberClub - Supabase Database Setup Guide

This guide will help you set up the Supabase database for the BarberClub application.

## Prerequisites

1. A Supabase account (https://supabase.com)
2. Node.js installed on your machine
3. This project cloned locally

## Supabase Setup

### 1. Create a New Supabase Project

1. Go to https://supabase.com and sign in to your account
2. Click "New project"
3. Choose your organization
4. Fill in your project details:
   - **Name**: BarberClub
   - **Database Password**: Choose a strong password
   - **Region**: Choose the region closest to your users
5. Click "Create new project"

### 2. Get Your Project Credentials

Once your project is created:

1. Go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (something like `https://xxxxx.supabase.co`)
   - **Project API Key** (anon public key)
   - **Service Role Key** (for admin operations)

### 3. Set Up Environment Variables

1. Copy the `.env.example` file to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Open `.env.local` and fill in your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```

### 4. Create Database Schema

1. Go to your Supabase dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `database/supabase-schema.sql`
4. Paste it into a new SQL query
5. Click "Run" to execute the schema

This will create all the necessary tables, relationships, indexes, and sample data.

## Database Schema Overview

The database schema includes the following main tables:

### Core Tables

- **`user_types`** - Defines user roles (superadmin, barbershop_admin, barber)
- **`users`** - User accounts with authentication and role information
- **`barbershops`** - Barbershop information and settings
- **`barbers`** - Barber profiles linked to users and barbershops
- **`services`** - Services offered by each barbershop
- **`appointments`** - Customer appointments with barbers
- **`schedules`** - Barber working hours and availability

### Lookup Tables

- **`barbershop_status`** - Status options for barbershops (pending, active, inactive)
- **`appointment_status`** - Status options for appointments (pending, confirmed, cancelled, completed)

### Key Relationships

1. **User → UserType**: Each user has a type (role)
2. **User → Barber**: Some users are also barbers (1:1 relationship)
3. **Barbershop → User**: Each barbershop has an owner (admin user)
4. **Barber → Barbershop**: Each barber belongs to one barbershop
5. **Appointment → Barber + Service**: Each appointment involves one barber and one service
6. **Schedule → Barber**: Each barber has multiple schedule entries (one per day)

## Row Level Security (RLS)

The schema includes basic RLS policies:

- **Users can view their own data**
- **Superadmins can view all data**
- **Barbershop owners can view their barbershop data**
- **Barbers can view their own barbershop's data**

You may need to customize these policies based on your specific business requirements.

## Usage in Code

The project includes several utility files for working with the database:

### Database Client
```typescript
import { supabase } from '@/lib/supabase'
```

### Service Functions
```typescript
import { 
  userService, 
  barbershopService, 
  barberService, 
  appointmentService 
} from '@/lib/database'
```

### API Layer
```typescript
import { 
  authApi, 
  barbershopsApi, 
  barbersApi, 
  appointmentsApi 
} from '@/lib/api'
```

### Example Usage

```typescript
// Get all barbershops
const barbershops = await barbershopsApi.getAll()

// Create a new appointment
const appointment = await appointmentsApi.create({
  customer_name: "Juan Pérez",
  customer_email: "juan@example.com",
  barber_id: "barber-uuid",
  service_id: "service-uuid",
  date: "2024-12-20T10:00:00Z",
  duration_min: 30,
  status_id: 1
})

// Get barber schedules
const schedules = await schedulesApi.getByBarber("barber-uuid")
```

## User Flow Implementation

### 1. Superadmin User
- Can manage all barbershops and users
- Access to admin dashboard with full permissions
- Can activate/deactivate barbershops

### 2. Barbershop Admin User
- Can manage their own barbershop
- Add/remove barbers from their barbershop
- Manage services and pricing
- View all appointments for their barbershop
- Also functions as a barber if they have a barber profile

### 3. Barber User
- Can view and manage their own appointments
- Update their schedule and availability
- Cancel or modify appointments
- View customer information for their appointments

## Testing the Setup

After setting up the database, you can test the connection:

1. Start the development server:
   ```bash
   npm run dev
   ```

2. The application should now be able to connect to Supabase
3. Check the browser console for any connection errors
4. Try creating a user account through the registration flow

## Troubleshooting

### Common Issues

1. **Connection Error**: Double-check your environment variables
2. **RLS Policy Error**: Make sure you're authenticated or adjust the policies
3. **Missing Tables**: Ensure the schema SQL was executed completely
4. **CORS Issues**: Check your Supabase project settings

### Database Reset

If you need to reset the database:

1. Go to **Settings** → **Database**
2. Scroll down to "Reset database password"
3. Or manually drop and recreate tables in the SQL editor

## Production Considerations

Before deploying to production:

1. **Update default passwords** in the sample data
2. **Review and customize RLS policies** for your specific use case
3. **Set up proper backups** in Supabase
4. **Configure email templates** for auth flows
5. **Set up proper logging and monitoring**

## Support

For issues with this setup, check:

1. Supabase documentation: https://supabase.com/docs
2. Project issues on GitHub
3. Supabase Discord community