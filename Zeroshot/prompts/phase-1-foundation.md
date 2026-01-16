You are building the Frozen Protein Pricing Platform - an automated weekly pricing system for frozen protein distribution.

READ FIRST: Docs/frozen-protein-pricing-platform-final.md for full context.

EXECUTE PHASE 1: FOUNDATION & INFRASTRUCTURE

## PROJECT INITIALIZATION

1. Initialize Next.js 14+ project with App Router and TypeScript:
   - Project name: frozen-protein-pricing
   - Use: TypeScript, Tailwind CSS, ESLint
   - App Router (not Pages Router)

2. Install core dependencies:
   ```
   npm install @supabase/supabase-js @supabase/ssr zustand @tanstack/react-query
   npm install tailwindcss postcss autoprefixer
   npm install lucide-react clsx tailwind-merge
   npm install -D @types/node @types/react
   ```

3. Create the following file structure:
   ```
   app/
     (auth)/
       login/page.tsx
       signup/page.tsx
     (dashboard)/
       layout.tsx
       page.tsx
     api/
     layout.tsx
     globals.css
   components/
     ui/
       button.tsx
       input.tsx
       card.tsx
       table.tsx
     providers.tsx
   lib/
     supabase/
       client.ts
       server.ts
       middleware.ts
     utils.ts
   ```

## SUPABASE SETUP

4. Create lib/supabase/client.ts - browser client:
   - Use createBrowserClient from @supabase/ssr
   - Read from environment variables

5. Create lib/supabase/server.ts - server client:
   - Use createServerClient from @supabase/ssr
   - Handle cookies properly for App Router

6. Create middleware.ts at project root:
   - Refresh auth tokens
   - Protect dashboard routes
   - Redirect unauthenticated users to /login

## AUTHENTICATION

7. Implement authentication pages:
   - /login - Email/password login with Supabase Auth
   - /signup - User registration
   - Include form validation
   - Handle auth errors gracefully
   - Redirect to dashboard on success

8. Create auth callback route at app/auth/callback/route.ts:
   - Handle OAuth callback (for future)
   - Exchange code for session

## DASHBOARD LAYOUT

9. Create dashboard layout at app/(dashboard)/layout.tsx:
   - Sidebar navigation with links:
     - Dashboard (home)
     - Inventory
     - Pricing
     - Customers
     - Freight
     - Deals
   - Header with user info and logout button
   - Responsive design (collapsible sidebar on mobile)

10. Create basic dashboard page at app/(dashboard)/page.tsx:
    - Welcome message
    - Quick stats cards (placeholder data for now):
      - Products uploaded
      - Price sheets generated
      - Active customers
      - Freight rates status

## UI COMPONENTS

11. Create reusable UI components in components/ui/:
    - Button (variants: primary, secondary, outline, ghost)
    - Input (with label and error states)
    - Card (with header, content, footer sections)
    - Table (responsive with sorting capability)

## ENVIRONMENT VARIABLES

12. Verify .env file exists with required variables (already created):
    - NEXT_PUBLIC_SUPABASE_URL
    - NEXT_PUBLIC_SUPABASE_ANON_KEY
    - SUPABASE_SERVICE_ROLE_KEY
    - NEXT_PUBLIC_MAPBOX_TOKEN
    - GOSHIP_API_KEY
    - ANTHROPIC_API_KEY

REQUIREMENTS:
- All TypeScript with strict mode
- Use App Router patterns (not Pages Router)
- Server Components by default, Client Components only when needed
- Proper error boundaries
- Loading states for async operations
- Mobile-responsive design

DO NOT:
- Install mapping libraries yet (Phase 4)
- Install AI libraries yet (Phase 5)
- Create database tables yet (Phase 2)
- Add any placeholder features beyond what's specified

OUTPUT:
After completion, the app should:
- Start with `npm run dev`
- Show login page at /login
- Allow signup and login via Supabase Auth
- Redirect authenticated users to dashboard
- Display sidebar navigation and placeholder stats
