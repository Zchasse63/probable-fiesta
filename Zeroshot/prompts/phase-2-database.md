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
npm install xlsx @tanstack/react-query sonner
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
