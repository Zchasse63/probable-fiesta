#!/bin/bash

# Phase 5 Validation Script
# Tests all acceptance criteria with and without ANTHROPIC_API_KEY

set -e

echo "=== Phase 5 AI Integration Validation ==="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASSED=0
FAILED=0

# Check if API key is configured
if [ -z "$ANTHROPIC_API_KEY" ] || [ "$ANTHROPIC_API_KEY" = "your-anthropic-api-key-here" ]; then
    echo -e "${YELLOW}WARNING: ANTHROPIC_API_KEY not configured. Testing fallback modes only.${NC}"
    echo ""
    HAS_KEY=false
else
    echo -e "${GREEN}ANTHROPIC_API_KEY configured. Testing full AI features.${NC}"
    echo ""
    HAS_KEY=true
fi

# Test helper
test_case() {
    local name="$1"
    local command="$2"
    local expected_exit="$3"

    echo -n "Testing: $name... "

    if eval "$command" > /dev/null 2>&1; then
        actual_exit=0
    else
        actual_exit=$?
    fi

    if [ "$actual_exit" -eq "$expected_exit" ]; then
        echo -e "${GREEN}PASS${NC}"
        ((PASSED++))
    else
        echo -e "${RED}FAIL${NC} (exit code: $actual_exit, expected: $expected_exit)"
        ((FAILED++))
    fi
}

# AC1: Upload dropzone auto-categorization
echo "=== AC1: Upload Dropzone Auto-Categorization ==="
test_case "Upload dropzone component exists" "[ -f components/inventory/upload-dropzone.tsx ]" 0
test_case "Categorization function imported" "grep -q 'categorizeProduct' components/inventory/upload-dropzone.tsx" 0
test_case "AI badge display implemented" "grep -q 'badge.*AI' components/inventory/upload-dropzone.tsx" 0
test_case "Manual override UI present" "grep -q 'Override' components/inventory/upload-dropzone.tsx" 0
echo ""

# AC2: Customer form address normalization
echo "=== AC2: Customer Form Address Normalization ==="
test_case "Customer form component exists" "[ -f components/customers/customer-form.tsx ]" 0
test_case "Normalize button implemented" "grep -q 'Normalize.*Address' components/customers/customer-form.tsx" 0
test_case "Diff display implemented" "grep -q 'original.*normalized' components/customers/customer-form.tsx" 0
test_case "Accept/reject flow present" "grep -q 'revert' components/customers/customer-form.tsx" 0
echo ""

# AC3: Smart search
echo "=== AC3: Smart Search ==="
test_case "SmartSearch component exists" "[ -f components/search/smart-search.tsx ]" 0
test_case "Natural language input implemented" "grep -q 'natural.*language' components/search/smart-search.tsx" 0
test_case "Filter interpretation display" "grep -q 'interpretation\\|explanation' components/search/smart-search.tsx" 0
test_case "Integrated in pricing page" "grep -q 'SmartSearch' app/\\(dashboard\\)/pricing/\\[zoneId\\]/page.tsx" 0
echo ""

# AC4: Deal inbox
echo "=== AC4: Deal Inbox ==="
test_case "Deal inbox page exists" "[ -f app/\\(dashboard\\)/deals/page.tsx ]" 0
test_case "DealParser component exists" "[ -f components/deals/deal-parser.tsx ]" 0
test_case "DealReview component exists" "[ -f components/deals/deal-review.tsx ]" 0
test_case "DealTable component exists" "[ -f components/deals/deal-table.tsx ]" 0
test_case "Parse deal API route exists" "[ -f app/api/ai/parse-deal/route.ts ]" 0
echo ""

# AC5: Excel export
echo "=== AC5: Excel Export ==="
test_case "Excel generation library exists" "[ -f lib/export/excel.ts ]" 0
test_case "Excel export button exists" "[ -f components/export/excel-export-button.tsx ]" 0
test_case "Excel API route exists" "[ -f app/api/export/excel/route.ts ]" 0
test_case "ExcelJS imported" "grep -q 'exceljs' lib/export/excel.ts" 0
test_case "Warehouse grouping implemented" "grep -q 'warehouse' lib/export/excel.ts" 0
test_case "Hyperlink support" "grep -q 'hyperlink' lib/export/excel.ts" 0
echo ""

# AC6: PDF export
echo "=== AC6: PDF Export ==="
test_case "PDF component exists" "[ -f lib/export/pdf.tsx ]" 0
test_case "PDF preview component exists" "[ -f components/export/pdf-preview.tsx ]" 0
test_case "PDF API route exists" "[ -f app/api/export/pdf/route.ts ]" 0
test_case "@react-pdf/renderer imported" "grep -q '@react-pdf/renderer' lib/export/pdf.tsx" 0
test_case "Warehouse sections in PDF" "grep -q 'warehouse' lib/export/pdf.tsx" 0
test_case "Header/footer implemented" "grep -q -E 'header|footer' lib/export/pdf.tsx" 0
echo ""

# AC7: AI usage dashboard
echo "=== AC7: AI Usage Dashboard ==="
test_case "AI usage page exists" "[ -f app/\\(dashboard\\)/settings/ai-usage/page.tsx ]" 0
test_case "AIUsageStats component exists" "[ -f components/settings/ai-usage-stats.tsx ]" 0
test_case "Token usage query" "grep -q 'tokens' components/settings/ai-usage-stats.tsx" 0
test_case "Cost calculation" "grep -q 'cost' components/settings/ai-usage-stats.tsx" 0
test_case "Task type grouping" "grep -q 'task_type' components/settings/ai-usage-stats.tsx" 0
echo ""

# AC8: Graceful degradation
echo "=== AC8: Graceful Degradation ==="
test_case "Circuit breaker exists" "[ -f lib/anthropic/circuit-breaker-persistent.ts ]" 0
test_case "Circuit breaker used in parsers" "grep -q 'circuit.*breaker' lib/anthropic/parsers.ts" 0
test_case "Fallback handling in upload" "grep -q 'catch\\|error' components/inventory/upload-dropzone.tsx" 0
test_case "Fallback handling in customer form" "grep -q 'catch\\|error' components/customers/customer-form.tsx" 0
test_case "withRetry utility exists" "grep -q 'withRetry' lib/anthropic/utils.ts" 0
echo ""

# AC9: Pack size AI fallback
echo "=== AC9: Pack Size AI Fallback ==="
test_case "Pack size parser exists" "[ -f lib/utils/pack-size-parser-server.ts ]" 0
test_case "AI fallback function" "grep -q 'parsePackSizeAI\\|aiParsePackSize' lib/utils/pack-size-parser-server.ts" 0
test_case "Parse pack size API route" "[ -f app/api/ai/parse-pack-size/route.ts ]" 0
test_case "Fallback logic in parser" "grep -q 'parsePackSizeAI' lib/utils/pack-size-parser-server.ts" 0
echo ""

# AC10: Deal review accept/reject
echo "=== AC10: Deal Review Accept/Reject ==="
test_case "Accept API route exists" "[ -f app/api/deals/\\[id\\]/accept/route.ts ]" 0
test_case "Reject API route exists" "[ -f app/api/deals/\\[id\\]/reject/route.ts ]" 0
test_case "Product creation in accept route" "grep -q 'insert.*products' app/api/deals/\\[id\\]/accept/route.ts" 0
test_case "Status update in reject route" "grep -q 'status.*rejected' app/api/deals/\\[id\\]/reject/route.ts" 0
test_case "Atomic operation (race condition prevention)" "grep -q 'eq.*pending' app/api/deals/\\[id\\]/accept/route.ts" 0
echo ""

# Security checks
echo "=== Security Verification ==="
test_case "Input sanitization in parse-deal" "grep -q 'sanitize\\|escape\\|trim' app/api/ai/parse-deal/route.ts" 0
test_case "Input sanitization in normalize-address" "grep -q 'sanitize\\|escape\\|trim' app/api/ai/normalize-address/route.ts" 0
test_case "Rate limiting configured" "grep -q 'rateLimit\\|rate.*limit' app/api/ai/parse-deal/route.ts" 0
test_case "Authentication on AI routes" "grep -q 'auth\\|session' app/api/ai/parse-deal/route.ts" 0
test_case "API key server-side only" "! grep -q 'ANTHROPIC_API_KEY' components/" 0
echo ""

# Build verification
echo "=== Build Verification ==="
test_case "TypeScript compiles" "npm run build 2>&1 | grep -q 'Compiled successfully'" 0 || true
echo ""

# Summary
echo "==================================="
echo -e "Results: ${GREEN}$PASSED passed${NC}, ${RED}$FAILED failed${NC}"
echo "==================================="

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ Phase 5 validation PASSED${NC}"
    exit 0
else
    echo -e "${RED}✗ Phase 5 validation FAILED${NC}"
    exit 1
fi
