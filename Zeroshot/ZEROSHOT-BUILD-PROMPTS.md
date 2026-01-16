# Frozen Protein Pricing Platform - Zeroshot Build Prompts

## Overview

This document contains phased prompts for Zeroshot to build the complete Frozen Protein Pricing Platform. Each phase builds on the previous and is designed for optimal Zeroshot execution with clear scope, requirements, and validation criteria.

**Project**: Automated weekly pricing system for frozen protein distribution
**Tech Stack**: Next.js 14+ (App Router), Supabase, react-map-gl, Claude AI, GoShip API
**Reference Docs**: `Docs/frozen-protein-pricing-platform-final.md`

---

## How to Use These Prompts

1. Run each phase sequentially with Zeroshot
2. Wait for completion and validate before moving to next phase
3. Each phase should complete in $10-25 budget
4. Review output between phases

```bash
# Example usage
zeroshot run "$(cat Zeroshot/prompts/phase-1.md)"
```

---

# PHASE 1: Foundation & Infrastructure

## Prompt

```
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

12. Create .env.local.example with required variables:
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
```

---

# PHASE 2: Database Schema & Core Data Management

## Prompt

```
You are continuing development of the Frozen Protein Pricing Platform.
Phase 1 (Foundation) is complete. The project has Next.js, Supabase auth, and dashboard layout.

READ FIRST: Docs/frozen-protein-pricing-platform-final.md for database schema details.

EXECUTE PHASE 2: DATABASE SCHEMA & CORE DATA MANAGEMENT

## DATABASE SCHEMA (Supabase)

1. Create Supabase migration file at supabase/migrations/001_initial_schema.sql:

   Create tables in this order (respecting foreign keys):

   a) zones - 4 freight zones
   b) warehouses - GA, PA warehouses
   c) upload_batches - track inventory uploads
   d) customers - 440+ food distributors
   e) products - inventory items
   f) price_sheets - generated price lists
   g) price_sheet_items - individual prices per product/zone
   h) freight_rates - cached freight quotes
   i) manufacturer_deals - parsed deals from emails
   j) ai_processing_log - AI usage tracking

   Use exact schema from Docs/frozen-protein-pricing-platform-final.md

2. Create supabase/migrations/002_indexes.sql:
   - idx_customers_zone
   - idx_customers_state
   - idx_products_warehouse
   - idx_products_upload_batch
   - idx_price_sheet_items_sheet
   - idx_freight_rates_lane

3. Create supabase/migrations/003_rls_policies.sql:
   - Enable RLS on all tables
   - Create policies for authenticated users
   - Users can only access their own data

4. Create supabase/seed.sql:
   - Insert 4 zones: Southeast, Northeast, Midwest, West
   - Insert 2 warehouses: PA (Boyertown, 19512), GA (Americus, 31709)
   - Insert sample products (10 items per warehouse)
   - Insert sample customers (20 distributors across zones)

## TYPE DEFINITIONS

5. Create lib/supabase/types.ts:
   - Generate types from schema using Supabase CLI pattern
   - Export Database type
   - Export Row types for each table
   - Export Insert types for each table
   - Export Update types for each table

## DATA HOOKS

6. Create lib/hooks/use-products.ts:
   - useProducts() - fetch products with filtering
   - useProduct(id) - fetch single product
   - useCreateProduct() - mutation to create
   - useUpdateProduct() - mutation to update
   - useDeleteProduct() - mutation to delete

7. Create lib/hooks/use-customers.ts:
   - useCustomers() - fetch with zone filtering
   - useCustomer(id) - fetch single
   - useCreateCustomer() - mutation
   - useUpdateCustomer() - mutation

8. Create lib/hooks/use-zones.ts:
   - useZones() - fetch all zones
   - useZone(id) - fetch single with customers

## INVENTORY UPLOAD

9. Create components/inventory/upload-dropzone.tsx:
   - Drag-and-drop Excel file upload
   - Accept .xlsx, .xls files
   - Show upload progress
   - Parse file client-side preview

10. Create lib/utils/excel-parser.ts:
    - parseInventoryExcel(file) - parse uploaded Excel
    - Extract columns: Item Code, Description, Pack Size, Brand, Cases, Unit Cost
    - Return structured data array
    - Handle parsing errors gracefully

11. Create lib/utils/pack-size-parser.ts:
    - parsePackSize(packSize: string): number | null
    - Regex patterns for common formats:
      - "6/5 LB" → 30
      - "4x10LB" → 40
      - "40 LB" → 40
      - "6-5#" → 30
    - Return null if unparseable (AI fallback later)

12. Create app/(dashboard)/inventory/page.tsx:
    - Upload section with dropzone
    - Preview table showing parsed data
    - Validation indicators (green/yellow/red)
    - "Import" button to save to database
    - List of existing products below

13. Create app/(dashboard)/inventory/[id]/page.tsx:
    - Product detail view
    - Edit form for product fields
    - Delete button with confirmation

## PRODUCT TABLE

14. Create components/inventory/product-table.tsx:
    - Sortable columns
    - Filter by warehouse, category, brand
    - Search by description
    - Pagination
    - Row click → product detail

## API ROUTES

15. Create app/api/products/route.ts:
    - GET: List products with filters
    - POST: Create product (or batch create)

16. Create app/api/products/[id]/route.ts:
    - GET: Single product
    - PATCH: Update product
    - DELETE: Delete product

17. Create app/api/upload/route.ts:
    - POST: Handle Excel upload
    - Parse and validate
    - Create upload_batch record
    - Insert products
    - Return batch summary

REQUIREMENTS:
- Use React Query for data fetching/caching
- Optimistic updates for mutations
- Proper error handling with toast notifications
- Loading skeletons for async content
- Excel parsing using SheetJS (xlsx package)

INSTALL:
```
npm install xlsx @tanstack/react-query
npm install sonner (for toasts)
```

DO NOT:
- Implement AI fallback parsing yet (Phase 5)
- Implement freight calculations yet (Phase 3)
- Add mapping features yet (Phase 4)

OUTPUT:
After completion:
- Database tables exist in Supabase
- Can upload Excel inventory file
- Products display in sortable/filterable table
- Can create/edit/delete products
- Pack sizes parse to case weights
```

---

# PHASE 3: Pricing Engine & Freight Integration

## Prompt

```
You are continuing development of the Frozen Protein Pricing Platform.
Phase 1 (Foundation) and Phase 2 (Database & Data) are complete.

READ FIRST: Docs/frozen-protein-pricing-platform-final.md for pricing logic.
READ: Docs/GoShip-LTL-Quote-API-Integration.pdf for GoShip API details.

EXECUTE PHASE 3: PRICING ENGINE & FREIGHT INTEGRATION

## GOSHIP API CLIENT

1. Create lib/goship/client.ts:
   - GraphQL client setup for GoShip API
   - Endpoint: https://nautilus.goship.com/broker/graphql
   - Header: X-GoShip-API-Key from environment
   - Use native fetch (no Apollo needed for simple queries)

2. Create lib/goship/types.ts:
   - LtlRfqInput type
   - LtlQuote response type
   - ItemInput type
   - RfqEndpointInput type

3. Create lib/goship/queries.ts:
   - requestLTLQuote GraphQL query
   - Input: origin, destination, items, pickupDate
   - Response: cost, carrier, id, deliveryDate

4. Create lib/goship/api.ts:
   - getLTLQuote(params) - fetch LTL quote
   - Handle API errors gracefully
   - Return structured response

## REEFER ESTIMATION

5. Create lib/utils/freight-calculator.ts:
   - estimateReeferRate(dryQuote, origin, shipDate)
   - Config object:
     - baseMultiplier: 2.25 (reefer vs dry)
     - originModifiers: PA=1.10, GA=1.00, IN=1.05
     - seasonModifiers: May-Jul=1.15 (peak), Nov-Dec=1.08 (holiday)
     - minimumCharge: 350
   - Return: estimate, rangeLow (85%), rangeHigh (115%), factors

6. Create lib/utils/price-calculator.ts:
   - calculateDeliveredPrice(product, margin, freightPerLb)
   - Formula: cost_per_lb + margin_amount + freight_per_lb
   - calculateMarginAmount(costPerLb, marginPercent)
   - calculateCostPerLb(unitCost, caseWeight)

## FREIGHT MANAGEMENT PAGE

7. Create app/(dashboard)/freight/page.tsx:
   - Current rates table by lane (warehouse → zone)
   - Last calibration date
   - Manual rate override form
   - "Refresh Rates" button to fetch new quotes
   - Rate comparison: estimated vs actual (when available)

8. Create components/freight/rate-table.tsx:
   - Display freight rates by warehouse/zone
   - Show dry quote, reefer estimate, rate per lb
   - Editable override column
   - Status indicator (fresh/stale/expired)

9. Create components/freight/rate-calculator.tsx:
   - Manual quote calculator
   - Select origin warehouse
   - Enter destination ZIP
   - Enter weight
   - Show estimated reefer rate

## FREIGHT API ROUTES

10. Create app/api/freight/quote/route.ts:
    - POST: Get GoShip quote
    - Input: origin (warehouse), destination (zip/city/state), weight
    - Apply reefer estimation
    - Return quote with breakdown

11. Create app/api/freight/calibrate/route.ts:
    - POST: Calibrate lanes
    - Fetch quotes for key destinations per zone
    - Store in freight_rates table
    - Return summary

## MARGIN MANAGEMENT

12. Create components/pricing/margin-editor.tsx:
    - Table of products with margin column
    - Inline editing of margin percentage
    - Bulk actions: Apply X% to all, Apply to selection
    - Show calculated margin $/lb
    - Preset buttons: 12%, 15%, 18%

13. Create lib/hooks/use-margins.ts:
    - useMargins(zoneId) - fetch/store margins by zone
    - useUpdateMargin() - update single product margin
    - useBulkUpdateMargins() - batch update

## PRICE SHEET BUILDER

14. Create app/(dashboard)/pricing/page.tsx:
    - Zone selector (tabs or dropdown)
    - Product list with calculated prices
    - Margin adjustment panel
    - Freight rate summary for selected zone
    - "Generate Price Sheet" button
    - Preview mode before generation

15. Create app/(dashboard)/pricing/[zoneId]/page.tsx:
    - Zone-specific price sheet view
    - Full product list with:
      - Item code, description, pack, brand
      - Cost/lb, margin %, margin $/lb
      - Freight/lb, delivered price
    - Edit margins inline
    - Export buttons (Excel, PDF - functionality in Phase 5)

16. Create components/pricing/price-table.tsx:
    - Display calculated prices
    - Group by warehouse
    - Sortable columns
    - Highlight low-margin items
    - Show price breakdown on hover

## PRICE CALCULATION API

17. Create app/api/pricing/calculate/route.ts:
    - POST: Calculate prices for zone
    - Input: zoneId, productIds, margins
    - Fetch freight rates for zone
    - Calculate delivered prices
    - Return price sheet data

18. Create app/api/pricing/sheets/route.ts:
    - GET: List price sheets
    - POST: Create new price sheet
    - Store in price_sheets and price_sheet_items tables

19. Create app/api/pricing/sheets/[id]/route.ts:
    - GET: Fetch price sheet with items
    - PATCH: Update status (draft → published)
    - DELETE: Remove price sheet

## HOOKS

20. Create lib/hooks/use-freight-rates.ts:
    - useFreightRates(zoneId)
    - useFreightRate(warehouseId, zoneId)
    - useUpdateFreightRate()
    - useCalibrateLanes()

21. Create lib/hooks/use-price-sheets.ts:
    - usePriceSheets()
    - usePriceSheet(id)
    - useCreatePriceSheet()
    - usePublishPriceSheet()

REQUIREMENTS:
- Handle GoShip API errors gracefully
- Cache freight rates (7 day validity)
- Real-time price recalculation on margin change
- Debounce margin inputs
- Show loading states during calculation

DO NOT:
- Implement PDF/Excel export yet (Phase 5)
- Add AI features yet (Phase 5)
- Add mapping features yet (Phase 4)

OUTPUT:
After completion:
- Can fetch GoShip LTL quotes
- Reefer rates estimated from dry quotes
- Freight rates stored and managed
- Margins editable per product
- Delivered prices calculated correctly
- Price sheets created and stored
```

---

# PHASE 4: Customer Management & Mapping

## Prompt

```
You are continuing development of the Frozen Protein Pricing Platform.
Phases 1-3 are complete. Project has auth, database, inventory, and pricing.

READ FIRST: Docs/frozen-protein-pricing-platform-final.md for mapping details.

EXECUTE PHASE 4: CUSTOMER MANAGEMENT & MAPPING

## INSTALL MAPPING DEPENDENCIES

```
npm install react-map-gl mapbox-gl supercluster
npm install @types/supercluster
npm install @nebula.gl/layers @nebula.gl/edit-modes (for lasso selection)
```

## MAPBOX SETUP

1. Create lib/mapbox/config.ts:
   - MAPBOX_CONFIG object
   - Access token from environment
   - Map styles: light, streets, satellite
   - Geocoding endpoint configuration
   - US-only country restriction

2. Create lib/mapbox/geocode.ts:
   - geocodeAddress(address) - convert address to lat/lng
   - Use Mapbox Geocoding API
   - Return: latitude, longitude, confidence
   - Handle errors gracefully

3. Create lib/mapbox/zones.ts:
   - getZoneGeoJSON() - return zone boundaries as GeoJSON
   - Zone definitions with state groupings:
     - Zone 1 (Southeast): FL, GA, AL, SC, NC, TN, MS
     - Zone 2 (Northeast): NY, NJ, PA, MA, CT, MD, VA, DE
     - Zone 3 (Midwest): OH, MI, IL, IN, WI, MN, MO
     - Zone 4 (West/Other): TX, CA, and others
   - Include color coding per zone

## CUSTOMER MAP COMPONENT

4. Create components/map/customer-map.tsx:
   - Full react-map-gl implementation
   - Mapbox GL JS with light style
   - Navigation controls
   - Customer markers with clustering (Supercluster)
   - Zone boundary overlays (fill + line layers)
   - Viewport state management
   - Click handler for customer selection

5. Create components/map/customer-marker.tsx:
   - Custom marker component
   - Color-coded by zone
   - Show company name on hover
   - Animate on selection

6. Create components/map/cluster-marker.tsx:
   - Display cluster count
   - Click to zoom into cluster
   - Size based on point count

7. Create components/map/zone-layer.tsx:
   - GeoJSON source for zones
   - Fill layer with zone colors (10% opacity)
   - Line layer for borders
   - Zone labels

## LASSO SELECTION

8. Create components/map/lasso-tool.tsx:
   - Lasso/polygon drawing mode
   - Start/stop drawing button
   - Clear selection button
   - Uses @nebula.gl/edit-modes

9. Create lib/hooks/use-lasso-selection.ts:
   - useLassoSelection(customers)
   - Track drawing state
   - Point-in-polygon calculation
   - Return selected customers
   - Clear selection function

10. Create lib/utils/geometry.ts:
    - isPointInPolygon(point, polygon)
    - Ray casting algorithm
    - Handle edge cases

## CUSTOMER PAGES

11. Create app/(dashboard)/customers/page.tsx:
    - Customer list table
    - Filter by zone, state, customer type
    - Search by company name
    - Bulk actions menu
    - Link to map view
    - Import customers button

12. Create app/(dashboard)/customers/map/page.tsx:
    - Full-screen map view
    - Customer markers with clustering
    - Zone overlay toggle
    - Lasso selection tool
    - Selected customers panel (sidebar)
    - Bulk zone assignment for selection
    - Export selected customers

13. Create app/(dashboard)/customers/[id]/page.tsx:
    - Customer detail view
    - Edit form: company, address, contact info
    - Zone assignment dropdown
    - Mini map showing location
    - Order history (placeholder for future)

14. Create components/customers/customer-table.tsx:
    - Sortable/filterable table
    - Columns: Company, City, State, Zone, Type, Contact
    - Row actions: Edit, View on Map, Delete
    - Checkbox selection for bulk actions

15. Create components/customers/customer-form.tsx:
    - Form for create/edit customer
    - Address fields with geocoding
    - Zone auto-assignment based on state
    - Validation

16. Create components/customers/customer-sidebar.tsx:
    - Slide-out panel for customer details
    - Used in map view when marker clicked
    - Quick edit capabilities
    - Zone reassignment

## CUSTOMER IMPORT

17. Create components/customers/import-modal.tsx:
    - CSV/Excel upload
    - Column mapping interface
    - Preview with validation
    - Batch geocoding option
    - Import button

18. Create lib/utils/customer-parser.ts:
    - parseCustomerFile(file) - parse CSV/Excel
    - mapColumns(data, mapping) - map to schema
    - validateCustomers(customers) - validate data
    - Return parsed customers array

19. Create app/api/customers/import/route.ts:
    - POST: Batch import customers
    - Validate data
    - Geocode addresses (batch)
    - Auto-assign zones by state
    - Insert into database

## GEOCODING API

20. Create app/api/geocode/route.ts:
    - POST: Geocode single address
    - Use Mapbox Geocoding API
    - Return coordinates + confidence

21. Create app/api/geocode/batch/route.ts:
    - POST: Batch geocode addresses
    - Rate limit to avoid API limits
    - Return results array

## ZONE MANAGEMENT

22. Create app/(dashboard)/customers/zones/page.tsx:
    - Zone overview with customer counts
    - Edit zone configurations
    - Color picker for zone display
    - State assignment per zone

23. Create components/customers/zone-assignment.tsx:
    - Bulk zone assignment component
    - Select zone dropdown
    - Apply to selected customers
    - Confirmation dialog

## HOOKS

24. Create lib/hooks/use-customer-map.ts:
    - useCustomerMap() - manage map state
    - Viewport, selected customer, filters
    - Cluster configuration

25. Update lib/hooks/use-customers.ts:
    - Add: useCustomersByZone(zoneId)
    - Add: useBulkUpdateCustomerZone()
    - Add: useGeocodeCustomers()

REQUIREMENTS:
- Map performs well with 440+ markers (clustering required)
- Geocoding respects Mapbox rate limits
- Zone assignment auto-calculates from state
- Responsive design - map works on mobile
- Lasso selection works smoothly

DO NOT:
- Implement AI address normalization yet (Phase 5)
- Add export features yet (Phase 5)

OUTPUT:
After completion:
- Full map view with clustered customer markers
- Zone overlays with color coding
- Lasso selection for bulk operations
- Customer CRUD operations
- CSV/Excel customer import with geocoding
- Zone management and bulk assignment
```

---

# PHASE 5: AI Integration & Export Features

## Prompt

```
You are continuing development of the Frozen Protein Pricing Platform.
Phases 1-4 are complete. Project has auth, database, inventory, pricing, and mapping.

READ FIRST: Docs/frozen-protein-pricing-platform-final.md for AI integration details.
READ: Docs/anthropic-sdk-setup-guide.md for SDK setup.
REFERENCE: ai-parsing-module.ts and ai-integration-examples.ts for patterns.

EXECUTE PHASE 5: AI INTEGRATION & EXPORT FEATURES

## INSTALL DEPENDENCIES

```
npm install @anthropic-ai/sdk
npm install exceljs
npm install @react-pdf/renderer
```

## ANTHROPIC CLIENT SETUP

1. Create lib/anthropic/client.ts:
   - Initialize Anthropic client
   - MODELS constant: HAIKU, SONNET, OPUS
   - Export client instance

2. Create lib/anthropic/tools.ts:
   - Tool definitions (JSON schemas) for:
     - extract_deal - manufacturer deal extraction
     - normalize_address - address standardization
     - parse_pack_size - pack size parsing
     - categorize_product - product categorization
     - query_to_filter - natural language search
   - Each with proper input_schema and required fields

3. Create lib/anthropic/parsers.ts:
   - parseDealEmail(content) - extract deal from email
   - normalizeAddress(address) - standardize address
   - parsePackSize(packSize, description?) - parse pack weight
   - categorizeProduct(description) - auto-categorize
   - parseSearchQuery(query) - NL to filters
   - All use tool_choice to force structured output
   - Return typed responses with tokens_used

4. Create lib/anthropic/utils.ts:
   - withRetry(fn, maxRetries) - exponential backoff
   - calculateCost(model, inputTokens, outputTokens)
   - logUsage(supabase, task, response) - track usage

## AI API ROUTES

5. Create app/api/ai/parse-deal/route.ts:
   - POST: Parse manufacturer deal email
   - Store in manufacturer_deals table
   - Log AI usage
   - Return parsed deal

6. Create app/api/ai/normalize-address/route.ts:
   - POST: Normalize address for geocoding
   - Return normalized components
   - Log corrections made

7. Create app/api/ai/parse-pack-size/route.ts:
   - POST: AI fallback for unparseable pack sizes
   - Input: packSize, description
   - Return case_weight_lbs

8. Create app/api/ai/categorize/route.ts:
   - POST: Auto-categorize product
   - Return: category, subcategory, is_frozen, is_raw

9. Create app/api/ai/search/route.ts:
   - POST: Natural language to filters
   - Return: filters object, explanation

## AI INTEGRATION IN EXISTING FEATURES

10. Update lib/utils/pack-size-parser.ts:
    - Add aiParsePackSize fallback
    - Called when regex returns null
    - Graceful fallback on AI failure

11. Update components/customers/customer-form.tsx:
    - Add "Normalize Address" button
    - Call AI to standardize before geocoding
    - Show corrections made

12. Update components/inventory/upload-dropzone.tsx:
    - Auto-categorize products on upload
    - Show AI-assigned categories
    - Allow manual override

13. Create components/search/smart-search.tsx:
    - Natural language search input
    - Parse query with AI
    - Show interpretation
    - Apply filters to product table

## DEAL INBOX

14. Create app/(dashboard)/deals/page.tsx:
    - Deal inbox interface
    - Paste email content or upload
    - AI parses and extracts deal info
    - Review/edit parsed data
    - Accept/reject deals
    - Convert accepted deals to inventory

15. Create components/deals/deal-parser.tsx:
    - Textarea for email content
    - "Parse" button
    - Loading state during AI processing
    - Display extracted fields
    - Confidence score indicator

16. Create components/deals/deal-review.tsx:
    - Review parsed deal
    - Edit fields if incorrect
    - Accept → creates product
    - Reject → archives deal

17. Create components/deals/deal-table.tsx:
    - List of parsed deals
    - Status: pending, accepted, rejected
    - Filter by status
    - Bulk actions

## EXCEL EXPORT

18. Create lib/export/excel.ts:
    - generatePriceSheetExcel(priceSheet, items, zone)
    - Uses ExcelJS
    - Styling: headers, colors, column widths
    - Group by warehouse
    - Include: code, description, pack, brand, avail, $/lb
    - Hyperlinks to spec sheets
    - Return Workbook

19. Create components/export/excel-export-button.tsx:
    - Button to trigger Excel download
    - Show progress for large sheets
    - Handle errors

20. Create app/api/export/excel/route.ts:
    - POST: Generate Excel file
    - Input: priceSheetId
    - Generate workbook
    - Return as blob/download

## PDF EXPORT

21. Create lib/export/pdf.tsx:
    - PriceSheetPDF React component
    - Uses @react-pdf/renderer
    - Styled document with:
      - Header with zone/date
      - Product table grouped by warehouse
      - Footer with terms
    - Print-friendly layout

22. Create components/export/pdf-preview.tsx:
    - In-browser PDF preview
    - Uses PDFViewer from @react-pdf/renderer
    - Download button

23. Create app/api/export/pdf/route.ts:
    - POST: Generate PDF file
    - Input: priceSheetId
    - Render PDF
    - Return as blob/download

## UPDATE PRICE SHEET PAGES

24. Update app/(dashboard)/pricing/[zoneId]/page.tsx:
    - Add export buttons: "Download Excel", "Download PDF"
    - Preview modal for PDF
    - Progress indicators during generation

25. Create components/pricing/export-panel.tsx:
    - Export options panel
    - Select format: Excel, PDF, Both
    - Include options (all products, selected only)
    - Generate and download

## AI USAGE DASHBOARD

26. Create app/(dashboard)/settings/ai-usage/page.tsx:
    - AI usage statistics
    - Tokens by task type
    - Estimated cost this month
    - Usage over time chart

27. Create components/settings/ai-usage-stats.tsx:
    - Display usage from ai_processing_log
    - Group by task type
    - Show success/failure rate

REQUIREMENTS:
- AI errors should not break the app - graceful fallbacks
- Track all AI usage in ai_processing_log
- Respect rate limits with retry logic
- Show confidence scores where applicable
- Export files should be professional quality

DO NOT:
- Over-engineer AI features beyond spec
- Make AI calls synchronously block UI
- Skip error handling for AI failures

OUTPUT:
After completion:
- AI parses manufacturer deal emails
- AI normalizes addresses before geocoding
- AI fallback for unparseable pack sizes
- Natural language product search
- Excel export with professional styling
- PDF export with printable layout
- AI usage tracking and dashboard
```

---

# PHASE 6: Polish, Testing & Launch Prep

## Prompt

```
You are completing development of the Frozen Protein Pricing Platform.
Phases 1-5 are complete. All features are implemented.

READ FIRST: Docs/frozen-protein-pricing-platform-final.md for reference.

EXECUTE PHASE 6: POLISH, TESTING & LAUNCH PREP

## DASHBOARD IMPROVEMENTS

1. Update app/(dashboard)/page.tsx - Complete Dashboard:
   - Real stats from database (not placeholders):
     - Total products count
     - Products by category (chicken/beef/pork)
     - Products by warehouse
     - Price sheets generated this week
     - Active customers by zone
     - Freight rates status (fresh/stale count)
   - Recent activity log (last 10 actions)
   - Quick actions: Upload inventory, Generate price sheet
   - Pending deals count (if any)

2. Create components/dashboard/stats-card.tsx:
   - Animated number display
   - Trend indicator (up/down)
   - Click to navigate to detail

3. Create components/dashboard/activity-feed.tsx:
   - Recent uploads, price sheets, deals
   - Timestamp formatting
   - User who performed action

4. Create components/dashboard/quick-actions.tsx:
   - Upload Inventory button
   - New Price Sheet button
   - View Customers button
   - Check Freight Rates button

## ERROR HANDLING

5. Create components/error-boundary.tsx:
   - Catch React errors
   - Show friendly error message
   - "Try Again" button
   - Report error option

6. Create app/error.tsx:
   - App Router error boundary
   - Handle runtime errors
   - Reset functionality

7. Create app/not-found.tsx:
   - Custom 404 page
   - Navigation back to dashboard

8. Update all API routes:
   - Consistent error response format
   - Proper HTTP status codes
   - Detailed error messages (dev only)
   - Sanitized errors (production)

## LOADING STATES

9. Create components/ui/skeleton.tsx:
   - Skeleton loader component
   - Variants: text, card, table-row, avatar

10. Add loading.tsx files:
    - app/(dashboard)/loading.tsx
    - app/(dashboard)/inventory/loading.tsx
    - app/(dashboard)/pricing/loading.tsx
    - app/(dashboard)/customers/loading.tsx
    - app/(dashboard)/customers/map/loading.tsx
    - app/(dashboard)/freight/loading.tsx
    - app/(dashboard)/deals/loading.tsx

## FORM VALIDATION

11. Install and configure:
    ```
    npm install zod react-hook-form @hookform/resolvers
    ```

12. Create lib/validations/:
    - product.ts - product form schema
    - customer.ts - customer form schema
    - margin.ts - margin input validation
    - upload.ts - file upload validation

13. Update all forms to use zod validation:
    - Product create/edit forms
    - Customer create/edit forms
    - Deal review form
    - Import forms

## TOAST NOTIFICATIONS

14. Create components/providers/toast-provider.tsx:
    - Global toast provider (using sonner)
    - Configure position, duration
    - Success/error/warning variants

15. Add toast notifications to:
    - Successful CRUD operations
    - Upload completions
    - Export completions
    - AI parsing results
    - Error conditions

## RESPONSIVE DESIGN AUDIT

16. Review and fix mobile layouts:
    - Dashboard - stack cards vertically
    - Tables - horizontal scroll or card view
    - Map - touch-friendly controls
    - Forms - full width inputs
    - Sidebar - collapsible/drawer on mobile
    - Navigation - hamburger menu

17. Create components/ui/responsive-table.tsx:
    - Table that converts to cards on mobile
    - Maintain sort/filter on mobile

## PERFORMANCE OPTIMIZATION

18. Add React Query optimizations:
    - Stale time configurations
    - Cache invalidation strategy
    - Prefetching for common routes
    - Optimistic updates

19. Implement code splitting:
    - Lazy load map components
    - Lazy load PDF renderer
    - Dynamic imports for heavy features

20. Image/asset optimization:
    - Use next/image for any images
    - Optimize static assets

## ACCESSIBILITY

21. Audit and fix accessibility:
    - All buttons have labels
    - Form inputs have proper labels
    - Color contrast compliance
    - Keyboard navigation works
    - Focus indicators visible
    - Screen reader friendly

## ENVIRONMENT & DEPLOYMENT

22. Create .env.production.example:
    - All required env vars documented
    - Notes on each variable

23. Update next.config.js:
    - Production optimizations
    - Image domains if needed
    - Redirects/rewrites if needed

24. Create vercel.json (if deploying to Vercel):
    - Build settings
    - Environment variable references

## DOCUMENTATION

25. Update README.md:
    - Project overview
    - Setup instructions
    - Environment variables
    - Development workflow
    - Deployment guide

## FINAL VALIDATION

26. Test all user flows:
    - Sign up → login → dashboard
    - Upload inventory → view products → edit
    - Create price sheet → adjust margins → export
    - Import customers → view on map → assign zones
    - Paste deal email → AI parse → accept/reject
    - Calculate freight → view rates → override

27. Verify all integrations:
    - Supabase auth works
    - Database CRUD operations work
    - GoShip API returns quotes
    - Mapbox geocoding works
    - AI parsing returns structured data
    - Excel/PDF exports generate correctly

REQUIREMENTS:
- All features must work end-to-end
- No console errors in production
- Mobile-friendly on all pages
- Loading states for all async operations
- Error states for all failure modes
- Accessible to screen readers

DO NOT:
- Add new features
- Change existing functionality
- Remove any working code

OUTPUT:
After completion:
- Dashboard shows real statistics
- All forms have validation
- Toast notifications on actions
- Responsive on all screen sizes
- Loading/error states everywhere
- Production-ready build
- Documentation complete
```

---

## Summary

| Phase | Focus | Est. Cost | Est. Time |
|-------|-------|-----------|-----------|
| 1 | Foundation & Infrastructure | $8-12 | 20-30 min |
| 2 | Database & Core Data | $12-18 | 30-45 min |
| 3 | Pricing Engine & Freight | $15-22 | 40-60 min |
| 4 | Customer & Mapping | $15-25 | 45-70 min |
| 5 | AI Features & Exports | $18-28 | 50-80 min |
| 6 | Polish & Launch | $10-18 | 30-50 min |
| **Total** | | **$78-123** | **~4-6 hours** |

## Tips for Running Phases

1. **Run each phase completely** before moving to the next
2. **Verify the output** - check that features work before proceeding
3. **If a phase fails**, you can retry with the same prompt
4. **Between phases**, manually test the app (`npm run dev`)
5. **Commit between phases** - `git add . && git commit -m "Phase X complete"`

## Troubleshooting

If Zeroshot gets stuck:
- Check `zeroshot status <cluster-id>`
- Review logs: `zeroshot logs <cluster-id>`
- Kill and retry: `zeroshot kill <cluster-id>`

If validation keeps failing:
- The prompt may be too broad - consider splitting
- Check if tests are passing: `npm test`
- Review the specific validator feedback
