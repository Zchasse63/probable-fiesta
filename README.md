# Frozen Protein Pricing Platform

Next.js platform for automated weekly pricing for frozen protein distribution with integrated customer management, freight calculations, and AI-powered data processing.

## Quick Start

1. **Environment Setup**
   ```bash
   cp .env.example .env
   # Configure your environment variables:
   # - NEXT_PUBLIC_SUPABASE_URL
   # - NEXT_PUBLIC_SUPABASE_ANON_KEY
   # - ANTHROPIC_API_KEY (for AI features)
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Run Development Server**
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) to access the application.

## Documentation

- **Architecture**: [Platform Specification](./docs/architecture/platform-spec.md)
- **API Integration**: [Supabase Info](./docs/api/supabase-info.md) | [GoShip LTL](./docs/api/goship-ltl-integration.pdf)
- **Setup Guides**: [Anthropic SDK Setup](./docs/guides/anthropic-sdk-setup.md)
- **Phase Notes**: [Implementation Notes](./docs/phase-notes/)

## Available Scripts

- `npm run dev` - Start development server (default: http://localhost:3000)
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run verify:db` - Verify database schema and connectivity

## Tech Stack

- **Framework**: Next.js 16.1.2 (React 19.2.3)
- **Language**: TypeScript 5
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS 4
- **AI Integration**: Anthropic Claude API
- **Maps**: Mapbox GL with React Map GL
- **State Management**: Zustand
- **Data Fetching**: TanStack Query (React Query)
- **Excel Processing**: ExcelJS
- **PDF Generation**: React PDF Renderer

## Project Structure

```
├── app/              # Next.js app router pages and API routes
├── components/       # React components
├── lib/              # Utility functions and shared logic
├── hooks/            # Custom React hooks
├── public/           # Static assets
├── scripts/          # Database and utility scripts
├── supabase/         # Supabase migrations and types
└── docs/             # Documentation and guides
```

## License

Private - All Rights Reserved
