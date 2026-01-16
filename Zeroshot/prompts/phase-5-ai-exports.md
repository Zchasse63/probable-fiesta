You are continuing development of the Frozen Protein Pricing Platform.
Phases 1-4 are complete. Project has auth, database, inventory, pricing, and mapping.

READ FIRST: Docs/frozen-protein-pricing-platform-final.md for AI integration details.
READ: Docs/anthropic-sdk-setup-guide.md for SDK setup.
REFERENCE: ai-parsing-module.ts and ai-integration-examples.ts for patterns.

EXECUTE PHASE 5: AI INTEGRATION & EXPORT FEATURES

## INSTALL DEPENDENCIES

```
npm install @anthropic-ai/sdk exceljs @react-pdf/renderer
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
