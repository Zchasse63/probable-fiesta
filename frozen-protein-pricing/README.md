# Frozen Protein Pricing Platform

A comprehensive pricing and customer management platform for frozen protein distribution, built with Next.js 16, Supabase, Mapbox, GoShip API, and Claude AI.

## Features

### Inventory Management
- Excel/CSV inventory import with validation
- Product catalog with warehouse assignment
- Real-time stock status tracking
- AI-powered product categorization and pack size parsing

### Dynamic Pricing Engine
- Zone-based pricing with configurable margins
- Freight-inclusive delivered pricing
- GoShip LTL reefer rate integration
- Automated price sheet generation
- Excel and PDF export options

### Customer Management
- Interactive Mapbox customer visualization
- Lasso selection for bulk zone assignment
- Geocoding and address validation
- CSV/Excel customer import
- Zone-based organization

### AI Features (Claude Integration)
- Smart product search with natural language
- Deal email parsing and extraction
- Automatic product categorization
- Address normalization

### Freight Management
- GoShip API integration for live quotes
- Lane calibration and rate caching
- Reefer rate estimation with seasonal adjustments
- Zone-based freight calculation

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account and project
- Mapbox account and access token
- GoShip API key (for freight quotes)
- Anthropic API key (for AI features)

### Environment Setup

Copy `.env.example` to `.env.local` and configure:

```bash
# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# GoShip API (Required for freight)
GOSHIP_API_KEY=your-goship-api-key

# Anthropic / Claude AI (Required for AI features)
ANTHROPIC_API_KEY=your-anthropic-api-key

# Mapbox (Required for mapping)
NEXT_PUBLIC_MAPBOX_TOKEN=your-mapbox-public-token
MAPBOX_SECRET_TOKEN=your-mapbox-secret-token

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Database Setup

1. Create a new Supabase project
2. Run the migrations in `supabase/migrations/` in order
3. Enable Row Level Security (RLS) policies

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Production Build

```bash
npm run build
npm start
```

## Project Structure

```
app/
  (dashboard)/          # Main authenticated pages
    page.tsx            # Dashboard with stats
    inventory/          # Product management
    pricing/            # Price sheet generation
    customers/          # Customer management
    customers/map/      # Interactive map
    freight/            # Freight rate management
    deals/              # AI deal parsing
  api/                  # API routes
    ai/                 # Claude AI endpoints
    export/             # PDF/Excel export
    freight/            # GoShip integration
    pricing/            # Price calculation

components/
  dashboard/            # Dashboard components
  deals/                # Deal parsing UI
  ui/                   # Shared UI components

lib/
  anthropic/            # Claude AI client
  export/               # PDF/Excel generators
  goship/               # GoShip API client
  supabase/             # Supabase clients
  utils/                # Freight calculator, zone lookup
  validations/          # Zod schemas
```

## Key Workflows

### 1. Upload Inventory
1. Navigate to Inventory
2. Click "Upload" and select warehouse
3. Upload Excel file with products
4. Review and confirm import

### 2. Generate Price Sheet
1. Navigate to Pricing
2. Select freight zone
3. Adjust base margin
4. Export as PDF or Excel

### 3. Manage Customers
1. Navigate to Customers
2. Import customer list or add manually
3. View on map and assign to zones
4. Use lasso tool for bulk operations

### 4. Parse Manufacturer Deals
1. Navigate to Deals
2. Paste deal email content
3. AI extracts product details
4. Review and accept/reject

## API Endpoints

### AI
- `POST /api/ai/parse-deal` - Parse deal emails
- `POST /api/ai/search` - Smart product search
- `POST /api/ai/categorize` - Categorize products

### Export
- `GET /api/export/pdf` - Generate PDF price sheet
- `GET /api/export/excel` - Generate Excel price sheet

### Freight
- `POST /api/freight/quote` - Get GoShip quote
- `POST /api/freight/calibrate` - Calibrate lane rates

### Pricing
- `POST /api/pricing/calculate` - Calculate prices
- `GET /api/pricing/sheets` - List price sheets

## Deployment

### Vercel (Recommended)

1. Connect your repository to Vercel
2. Configure environment variables
3. Deploy

### Environment Variables

See `.env.production.example` for production configuration.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Styling**: Tailwind CSS + shadcn/ui
- **Maps**: Mapbox GL JS
- **AI**: Anthropic Claude API
- **Freight**: GoShip GraphQL API
- **PDF**: @react-pdf/renderer
- **Excel**: ExcelJS
- **Validation**: Zod + react-hook-form

## License

Proprietary - All rights reserved
