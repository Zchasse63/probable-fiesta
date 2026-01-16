You are continuing development of the Frozen Protein Pricing Platform.
Phases 1-3 are complete. Project has auth, database, inventory, and pricing.

READ FIRST: Docs/frozen-protein-pricing-platform-final.md for mapping details.

EXECUTE PHASE 4: CUSTOMER MANAGEMENT & MAPPING

## INSTALL MAPPING DEPENDENCIES

```
npm install react-map-gl mapbox-gl supercluster
npm install @types/supercluster
npm install @nebula.gl/layers @nebula.gl/edit-modes
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
