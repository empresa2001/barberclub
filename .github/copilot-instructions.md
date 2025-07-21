# Copilot Instructions for BarberClub App

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

## Project Overview
This is a Progressive Web App (PWA) for barbershops built with Next.js, TypeScript, Tailwind CSS, and a Node.js backend with MySQL database.

## Key Context
- **Target**: Multi-tenant barbershop management platform
- **Users**: Superadmin, Barbershop Admin, Barber, Customer (no account)
- **Backend**: Node.js REST API with MySQL database
- **Frontend**: Next.js with App Router, TypeScript, Tailwind CSS
- **PWA**: Installable mobile app with offline capabilities
- **Notifications**: WhatsApp Business API integration

## Design Guidelines
- **Color Palette**: 
  - Primary: #1a1a1a (black), #ffffff (white)
  - Accent: #b02e2e (red), #2e4a7d (blue)
  - Secondary: #f2f2f2 (light gray)
- **Typography**: Poppins, Roboto, or Montserrat
- **Icons**: Lucide React
- **Style**: Modern, professional, masculine barbershop aesthetic
- **Mobile-first**: Responsive design optimized for mobile devices

## Architecture
- **Authentication**: JWT-based authentication (for admins/barbers only)
- **Database**: MySQL with proper indexing and relationships
- **State Management**: React hooks and context
- **Styling**: Tailwind CSS with custom theme
- **PWA**: Service Worker, Web App Manifest

## Security
- Implement proper API authentication with JWT tokens
- No authentication required for customers
- Secure API routes with proper authorization
- Validate all inputs and sanitize data
- Use environment variables for sensitive configuration

## Best Practices
- Use TypeScript for type safety
- Implement proper error handling
- Follow Next.js App Router conventions
- Use the API client (`src/lib/api.ts`) for all backend communication
- Optimize for performance and SEO
- Ensure accessibility compliance
- Use MySQL best practices for database queries
- Implement proper JWT token management
