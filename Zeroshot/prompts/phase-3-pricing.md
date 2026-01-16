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
