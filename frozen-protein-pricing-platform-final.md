# Frozen Protein Pricing Platform
## Final Project Plan v2.0

---

## 1. Executive Summary

**Purpose**: Automated weekly pricing system for frozen protein distribution (chicken, beef, pork) from Georgia and Pennsylvania warehouses to 440 food distributors across 4 freight zones.

**Key Decisions**:
- **Freight API**: GoShip only
- **Database**: Supabase (PostgreSQL + Auth + Storage + Edge Functions)
- **Mapping**: react-map-gl (Mapbox GL JS React wrapper)
- **AI Integration**: Claude API for document parsing, address normalization, and smart features
- **Deployment**: All phases built together as single comprehensive platform

---

## 2. Technology Stack

### Frontend
| Component | Technology | Purpose |
|-----------|------------|---------|
| Framework | React 18+ | UI framework |
| Mapping | react-map-gl | Mapbox GL JS wrapper for React |
| State | Zustand or React Query | Client state + server state |
| Styling | Tailwind CSS | Utility-first styling |
| File Export | ExcelJS | Excel generation (client-side) |
| PDF Export | @react-pdf/renderer | PDF generation |

### Backend
| Component | Technology | Purpose |
|-----------|------------|---------|
| Database | Supabase PostgreSQL | All persistent data |
| Auth | Supabase Auth | User authentication |
| Storage | Supabase Storage | Uploaded files, generated exports |
| Edge Functions | Supabase Edge Functions | API integrations, scheduled jobs |
| AI | Anthropic Claude API | Document parsing, smart features |
| Freight | GoShip API | LTL/FTL rate quotes |

### Infrastructure
| Component | Technology | Purpose |
|-----------|------------|---------|
| Hosting | Vercel or Supabase Hosting | Frontend deployment |
| Maps | Mapbox | Map tiles, geocoding |
| Monitoring | Supabase Dashboard | Database metrics, logs |

---

## 3. Supabase Database Schema

### Core Tables

```sql
-- Customers (440+ food distributors)
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  zone_id INTEGER REFERENCES zones(id),
  customer_type TEXT, -- 'food_distributor', 'paper_janitorial', etc.
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Zones (4 freight zones)
CREATE TABLE zones (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL, -- 'Southeast', 'Northeast', etc.
  code TEXT NOT NULL, -- 'zone_1', 'zone_2', etc.
  description TEXT,
  states TEXT[], -- Array of state codes
  color TEXT, -- Hex color for map display
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Warehouses
CREATE TABLE warehouses (
  id SERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL, -- 'A R T', 'GA COLD', etc.
  name TEXT NOT NULL,
  city TEXT,
  state TEXT,
  zip TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  is_active BOOLEAN DEFAULT true,
  serves_zones INTEGER[], -- Which zones this warehouse serves
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products (from inventory uploads)
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_code TEXT NOT NULL,
  description TEXT NOT NULL,
  pack_size TEXT, -- '6/5 LB' as-is from report
  case_weight_lbs DECIMAL(10, 2), -- Parsed: 30 lbs
  brand TEXT,
  category TEXT, -- 'chicken', 'beef', 'pork'
  warehouse_id INTEGER REFERENCES warehouses(id),
  cases_available INTEGER,
  unit_cost DECIMAL(10, 4), -- $/case from report
  cost_per_lb DECIMAL(10, 4), -- Calculated: unit_cost / case_weight
  spec_sheet_url TEXT,
  upload_batch_id UUID REFERENCES upload_batches(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Upload Batches (track each inventory upload)
CREATE TABLE upload_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  row_count INTEGER,
  status TEXT DEFAULT 'processing', -- 'processing', 'completed', 'error'
  error_message TEXT,
  user_id UUID REFERENCES auth.users(id)
);

-- Price Sheets (generated outputs)
CREATE TABLE price_sheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id INTEGER REFERENCES zones(id),
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  status TEXT DEFAULT 'draft', -- 'draft', 'published'
  excel_storage_path TEXT, -- Supabase Storage path
  pdf_storage_path TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ,
  user_id UUID REFERENCES auth.users(id)
);

-- Price Sheet Items (individual product prices per zone)
CREATE TABLE price_sheet_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  price_sheet_id UUID REFERENCES price_sheets(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  warehouse_id INTEGER REFERENCES warehouses(id),
  cost_per_lb DECIMAL(10, 4),
  margin_percent DECIMAL(5, 2) DEFAULT 15.00,
  margin_amount DECIMAL(10, 4),
  freight_per_lb DECIMAL(10, 4),
  delivered_price_lb DECIMAL(10, 4), -- Final price
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Freight Rates (cached/calibrated rates)
CREATE TABLE freight_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  origin_warehouse_id INTEGER REFERENCES warehouses(id),
  destination_zone_id INTEGER REFERENCES zones(id),
  destination_city TEXT, -- For lane-specific rates
  destination_state TEXT,
  rate_per_lb DECIMAL(10, 4),
  rate_type TEXT, -- 'estimated', 'actual', 'calibrated'
  weight_lbs INTEGER DEFAULT 7500, -- Weight assumption
  dry_ltl_quote DECIMAL(10, 2), -- Raw GoShip quote
  reefer_multiplier DECIMAL(5, 3), -- Applied multiplier
  season_modifier DECIMAL(5, 3),
  origin_modifier DECIMAL(5, 3),
  valid_from DATE,
  valid_until DATE,
  goship_quote_id TEXT, -- Reference to GoShip
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Manufacturer Deals (parsed from emails/documents)
CREATE TABLE manufacturer_deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type TEXT, -- 'email', 'pdf', 'manual'
  source_content TEXT, -- Original text/email body
  parsed_data JSONB, -- AI-extracted structured data
  product_description TEXT,
  price_per_lb DECIMAL(10, 4),
  quantity_lbs INTEGER,
  expiration_date DATE,
  manufacturer TEXT,
  confidence_score DECIMAL(3, 2), -- AI parsing confidence
  status TEXT DEFAULT 'pending', -- 'pending', 'accepted', 'rejected'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id)
);

-- AI Processing Log (track AI API usage)
CREATE TABLE ai_processing_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_type TEXT, -- 'document_parse', 'address_normalize', etc.
  input_summary TEXT,
  output_summary TEXT,
  tokens_used INTEGER,
  model TEXT,
  latency_ms INTEGER,
  success BOOLEAN,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Indexes for Performance

```sql
CREATE INDEX idx_customers_zone ON customers(zone_id);
CREATE INDEX idx_customers_state ON customers(state);
CREATE INDEX idx_customers_location ON customers USING GIST (
  ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
);
CREATE INDEX idx_products_warehouse ON products(warehouse_id);
CREATE INDEX idx_products_upload_batch ON products(upload_batch_id);
CREATE INDEX idx_price_sheet_items_sheet ON price_sheet_items(price_sheet_id);
CREATE INDEX idx_freight_rates_lane ON freight_rates(origin_warehouse_id, destination_zone_id);
```

### Row Level Security (RLS)

```sql
-- Enable RLS on all tables
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_sheets ENABLE ROW LEVEL SECURITY;
-- ... etc

-- Policy: Users can only see their own data
CREATE POLICY "Users can view own data" ON price_sheets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own data" ON price_sheets
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

---

## 4. AI Integration Points

### Where AI Adds Value

| Feature | AI Task | Model | Trigger |
|---------|---------|-------|---------|
| **Deal Email Parsing** | Extract product, price, quantity, expiration from unstructured emails | Claude Haiku 4.5 | Email upload/forward |
| **PDF Document Parsing** | Extract data from variable-format manufacturer spec sheets | Claude Haiku 4.5 | PDF upload |
| **Address Normalization** | Standardize/correct customer addresses before geocoding | Claude Haiku 4.5 | Customer import |
| **Pack Size Parsing** | Handle edge cases in pack size formats (e.g., "6-5# bags", "4x10LB") | Claude Haiku 4.5 | Inventory upload fallback |
| **Product Categorization** | Auto-classify products (chicken/beef/pork/other) from descriptions | Claude Haiku 4.5 | Product creation |
| **Anomaly Detection** | Flag unusual freight quotes or pricing | Claude Haiku 4.5 | Quote generation |
| **Natural Language Search** | "Show chicken under $2/lb from Georgia warehouse" | Claude Haiku 4.5 | Search bar |

### AI Integration Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend                                 │
├─────────────────────────────────────────────────────────────────┤
│  Upload Document  │  Import Customers  │  Search Products       │
└────────┬──────────┴─────────┬──────────┴──────────┬─────────────┘
         │                    │                     │
         ▼                    ▼                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Supabase Edge Functions                        │
├─────────────────────────────────────────────────────────────────┤
│  parse-document   │  normalize-address  │  natural-language-query│
│        │                   │                      │              │
│        ▼                   ▼                      ▼              │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Claude API (Haiku 4.5)                       │   │
│  │  - Structured output with tool_choice                     │   │
│  │  - JSON schema enforcement                                │   │
│  │  - Confidence scoring                                     │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
         │                    │                     │
         ▼                    ▼                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Supabase PostgreSQL                           │
│  manufacturer_deals  │  customers  │  products                   │
└─────────────────────────────────────────────────────────────────┘
```

### AI Prompt Templates

#### Deal Email Parsing
```javascript
const DEAL_PARSING_PROMPT = `
Extract the following information from this manufacturer deal email.
Return JSON with these fields:
- product_description: string
- price_per_lb: number (convert if given per case)
- quantity_available_lbs: number
- expiration_date: string (ISO format) or null
- manufacturer: string
- confidence: number 0-1

If a field cannot be determined, use null.
Calculate price_per_lb from case price if pack size is mentioned.

Email content:
{email_content}
`;
```

#### Address Normalization
```javascript
const ADDRESS_NORMALIZE_PROMPT = `
Normalize and validate this address for geocoding.
Fix common issues: abbreviations, typos, missing components.
Return JSON:
- normalized_address: string (single line)
- city: string
- state: string (2-letter code)
- zip: string (5 digits)
- confidence: number 0-1
- issues_found: string[] (list of corrections made)

Original address:
{raw_address}
`;
```

#### Natural Language Query
```javascript
const NL_QUERY_PROMPT = `
Convert this natural language query into a SQL WHERE clause for the products table.
Available columns: description, category, brand, cost_per_lb, warehouse_id, cases_available
Available warehouses: 1=PA, 2=GA, 3=IN, 4=CA

Query: "{user_query}"

Return JSON:
- sql_where: string (valid PostgreSQL WHERE clause)
- explanation: string (what the query is filtering for)
`;
```

### Estimated AI Costs

| Task | Frequency | Tokens/Call | Monthly Calls | Cost |
|------|-----------|-------------|---------------|------|
| Deal parsing | 5/day | ~2,000 | 150 | ~$1.50 |
| Address normalization | On import | ~500 | 500 | ~$1.25 |
| Pack size fallback | 10% of products | ~300 | 50 | ~$0.25 |
| Product categorization | On upload | ~200 | 200 | ~$0.50 |
| NL search | 10/day | ~500 | 300 | ~$0.75 |
| **Total** | | | | **~$4-5/month** |

Using Claude Haiku 4.5 at $1/MTok input, $5/MTok output.

---

## 5. GoShip API Integration

### API Configuration

```javascript
// goship-client.js
const GOSHIP_CONFIG = {
  baseUrl: 'https://api.goship.com/v2',
  // API key stored in Supabase secrets
  endpoints: {
    ltlQuote: '/ltl/quote',
    ftlQuote: '/ftl/quote',
    carriers: '/carriers',
    tracking: '/tracking'
  }
};
```

### Quote Request Structure

```javascript
// Request LTL quote from GoShip
async function getLTLQuote(params) {
  const { origin, destination, weight, pallets, freightClass } = params;
  
  const response = await fetch(`${GOSHIP_CONFIG.baseUrl}/ltl/quote`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GOSHIP_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      origin: {
        zip: origin.zip,
        city: origin.city,
        state: origin.state
      },
      destination: {
        zip: destination.zip,
        city: destination.city,
        state: destination.state
      },
      shipment: {
        handling_units: [{
          weight: weight,
          length: 48,
          width: 40,
          height: 48,
          freight_class: freightClass || '70',
          quantity: pallets
        }]
      },
      accessorials: ['LFTP', 'LDEL'] // Liftgate pickup/delivery
    })
  });
  
  return response.json();
}
```

### Reefer Estimation from Dry Quote

```javascript
// Convert dry LTL quote to reefer estimate
function estimateReeferRate(dryQuote, origin, shipDate) {
  const CONFIG = {
    baseMultiplier: 2.25,
    originModifiers: {
      'PA': 1.10,
      'GA': 1.00,
      'IN': 1.05
    },
    seasonModifiers: {
      1: 1.00, 2: 1.00, 3: 1.00, 4: 1.00,
      5: 1.15, 6: 1.15, 7: 1.15, // Peak produce
      8: 1.00, 9: 1.00, 10: 1.00,
      11: 1.08, 12: 1.08 // Holiday
    },
    minimumCharge: 350
  };
  
  const month = shipDate.getMonth() + 1;
  const originMod = CONFIG.originModifiers[origin] || 1.00;
  const seasonMod = CONFIG.seasonModifiers[month] || 1.00;
  
  const estimate = dryQuote * CONFIG.baseMultiplier * originMod * seasonMod;
  
  return {
    dryQuote,
    reeferEstimate: Math.max(estimate, CONFIG.minimumCharge),
    factors: { baseMultiplier: CONFIG.baseMultiplier, originMod, seasonMod },
    rangelow: estimate * 0.85,
    rangeHigh: estimate * 1.15
  };
}
```

### Lane Calibration Job (Supabase Edge Function)

```javascript
// supabase/functions/calibrate-freight-lanes/index.ts
import { createClient } from '@supabase/supabase-js';

const CALIBRATION_LANES = [
  // Zone 1 destinations
  { city: 'Jacksonville', state: 'FL', zone: 1 },
  { city: 'Miami', state: 'FL', zone: 1 },
  { city: 'Charlotte', state: 'NC', zone: 1 },
  { city: 'Nashville', state: 'TN', zone: 1 },
  { city: 'Birmingham', state: 'AL', zone: 1 },
  // Zone 2 destinations
  { city: 'New York', state: 'NY', zone: 2 },
  { city: 'Newark', state: 'NJ', zone: 2 },
  { city: 'Boston', state: 'MA', zone: 2 },
  { city: 'Baltimore', state: 'MD', zone: 2 },
  // Zone 3 destinations
  { city: 'Columbus', state: 'OH', zone: 3 },
  { city: 'Detroit', state: 'MI', zone: 3 },
  { city: 'Chicago', state: 'IL', zone: 3 },
  // Zone 4 destinations
  { city: 'Dallas', state: 'TX', zone: 4 },
  { city: 'Houston', state: 'TX', zone: 4 },
  { city: 'Los Angeles', state: 'CA', zone: 4 }
];

const WAREHOUSES = [
  { code: 'PA', zip: '19512', city: 'Boyertown', state: 'PA' },
  { code: 'GA', zip: '31709', city: 'Americus', state: 'GA' },
  { code: 'IN', zip: '46204', city: 'Indianapolis', state: 'IN' }
];

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const results = [];

  for (const warehouse of WAREHOUSES) {
    for (const dest of CALIBRATION_LANES) {
      // Get dry LTL quote from GoShip
      const dryQuote = await getLTLQuote({
        origin: warehouse,
        destination: dest,
        weight: 7500,
        pallets: 4,
        freightClass: '70'
      });

      // Calculate reefer estimate
      const reeferEstimate = estimateReeferRate(
        dryQuote.totalCharge,
        warehouse.code,
        new Date()
      );

      // Store in database
      const { error } = await supabase.from('freight_rates').upsert({
        origin_warehouse_id: warehouse.id,
        destination_zone_id: dest.zone,
        destination_city: dest.city,
        destination_state: dest.state,
        rate_per_lb: reeferEstimate.reeferEstimate / 7500,
        dry_ltl_quote: dryQuote.totalCharge,
        reefer_multiplier: 2.25,
        season_modifier: reeferEstimate.factors.seasonMod,
        origin_modifier: reeferEstimate.factors.originMod,
        valid_from: new Date().toISOString(),
        valid_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      });

      results.push({ warehouse: warehouse.code, dest: dest.city, rate: reeferEstimate });
    }
  }

  return new Response(JSON.stringify({ calibrated: results.length, results }));
});
```

---

## 6. Mapping Architecture

### react-map-gl + Mapbox Setup

```javascript
// MapView.jsx
import Map, { Marker, Source, Layer, NavigationControl } from 'react-map-gl';
import { useMemo, useState, useCallback } from 'react';
import Supercluster from 'supercluster';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export function CustomerMap({ customers, selectedZone, onCustomerSelect }) {
  const [viewport, setViewport] = useState({
    latitude: 33.749,
    longitude: -84.388,
    zoom: 5
  });

  // Cluster customers for performance
  const supercluster = useMemo(() => {
    const cluster = new Supercluster({
      radius: 40,
      maxZoom: 16
    });
    
    const points = customers.map(c => ({
      type: 'Feature',
      properties: { ...c },
      geometry: {
        type: 'Point',
        coordinates: [c.longitude, c.latitude]
      }
    }));
    
    cluster.load(points);
    return cluster;
  }, [customers]);

  // Get clusters for current viewport
  const clusters = useMemo(() => {
    const bounds = [
      viewport.longitude - 10,
      viewport.latitude - 10,
      viewport.longitude + 10,
      viewport.latitude + 10
    ];
    return supercluster.getClusters(bounds, Math.floor(viewport.zoom));
  }, [supercluster, viewport]);

  return (
    <Map
      {...viewport}
      onMove={evt => setViewport(evt.viewState)}
      mapboxAccessToken={MAPBOX_TOKEN}
      mapStyle="mapbox://styles/mapbox/light-v11"
      style={{ width: '100%', height: '100%' }}
    >
      <NavigationControl position="top-right" />
      
      {/* Zone boundaries */}
      <Source id="zones" type="geojson" data={zoneGeoJSON}>
        <Layer
          id="zone-fills"
          type="fill"
          paint={{
            'fill-color': ['get', 'color'],
            'fill-opacity': 0.1
          }}
        />
        <Layer
          id="zone-borders"
          type="line"
          paint={{
            'line-color': ['get', 'color'],
            'line-width': 2
          }}
        />
      </Source>

      {/* Customer markers with clustering */}
      {clusters.map(cluster => {
        const [lng, lat] = cluster.geometry.coordinates;
        const { cluster: isCluster, point_count } = cluster.properties;

        if (isCluster) {
          return (
            <Marker key={cluster.id} latitude={lat} longitude={lng}>
              <div className="cluster-marker">
                {point_count}
              </div>
            </Marker>
          );
        }

        return (
          <Marker
            key={cluster.properties.id}
            latitude={lat}
            longitude={lng}
            onClick={() => onCustomerSelect(cluster.properties)}
          >
            <CustomerPin customer={cluster.properties} />
          </Marker>
        );
      })}
    </Map>
  );
}
```

### Lasso Selection Tool

```javascript
// LassoTool.jsx
import { useCallback, useState } from 'react';
import { DrawPolygonMode } from '@nebula.gl/edit-modes';
import { EditableGeoJsonLayer } from '@nebula.gl/layers';

export function useLassoSelection(customers) {
  const [selectedCustomers, setSelectedCustomers] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [polygon, setPolygon] = useState(null);

  const handleDrawComplete = useCallback((polygon) => {
    // Find customers within polygon
    const selected = customers.filter(customer => {
      const point = [customer.longitude, customer.latitude];
      return isPointInPolygon(point, polygon.geometry.coordinates[0]);
    });
    
    setSelectedCustomers(selected);
    setPolygon(polygon);
    setIsDrawing(false);
  }, [customers]);

  const startLasso = () => setIsDrawing(true);
  const clearSelection = () => {
    setSelectedCustomers([]);
    setPolygon(null);
  };

  return {
    selectedCustomers,
    isDrawing,
    polygon,
    startLasso,
    clearSelection,
    handleDrawComplete
  };
}

// Point-in-polygon test
function isPointInPolygon(point, polygon) {
  const [x, y] = point;
  let inside = false;
  
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    
    if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }
  
  return inside;
}
```

### Mapbox Configuration

```javascript
// mapbox.config.js
export const MAPBOX_CONFIG = {
  accessToken: process.env.NEXT_PUBLIC_MAPBOX_TOKEN,
  styles: {
    light: 'mapbox://styles/mapbox/light-v11',
    streets: 'mapbox://styles/mapbox/streets-v12',
    satellite: 'mapbox://styles/mapbox/satellite-streets-v12'
  },
  geocoding: {
    endpoint: 'https://api.mapbox.com/geocoding/v5/mapbox.places',
    country: 'us', // Limit to US
    types: 'address,place,postcode'
  }
};

// Geocode an address
export async function geocodeAddress(address) {
  const encoded = encodeURIComponent(address);
  const url = `${MAPBOX_CONFIG.geocoding.endpoint}/${encoded}.json?` +
    `access_token=${MAPBOX_CONFIG.accessToken}&` +
    `country=${MAPBOX_CONFIG.geocoding.country}&` +
    `types=${MAPBOX_CONFIG.geocoding.types}`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  if (data.features && data.features.length > 0) {
    const [lng, lat] = data.features[0].center;
    return { latitude: lat, longitude: lng, confidence: data.features[0].relevance };
  }
  
  return null;
}
```

---

## 7. Application Features

### 7.1 Inventory Upload & Parsing

**Flow**:
1. User uploads Excel file (Inventory_01_07.xlsx format)
2. Traditional parsing extracts structured columns
3. AI fallback for edge cases (unusual pack sizes)
4. Products stored in Supabase with warehouse mapping
5. Case weight auto-calculated from pack size

**Pack Size Parser** (Traditional + AI Fallback):

```javascript
// Traditional regex patterns
const PACK_SIZE_PATTERNS = [
  /(\d+)\/(\d+(?:\.\d+)?)\s*(?:LB|#)/i,     // "6/5 LB" → 30 lbs
  /(\d+)x(\d+(?:\.\d+)?)\s*(?:LB|#)/i,      // "4x10 LB" → 40 lbs
  /(\d+)\s*(?:LB|#)\s*(?:CS|CASE)?/i,       // "40 LB" → 40 lbs
  /(\d+)-(\d+)#/i,                           // "6-5#" → 30 lbs
];

function parsePackSize(packSize) {
  for (const pattern of PACK_SIZE_PATTERNS) {
    const match = packSize.match(pattern);
    if (match) {
      if (match[2]) {
        return parseFloat(match[1]) * parseFloat(match[2]);
      }
      return parseFloat(match[1]);
    }
  }
  return null; // Trigger AI fallback
}

// AI fallback for unparseable formats
async function aiParsePackSize(packSize, description) {
  const response = await anthropic.messages.create({
    model: 'claude-3-5-haiku-20241022',
    max_tokens: 100,
    messages: [{
      role: 'user',
      content: `Extract the case weight in pounds from this pack size: "${packSize}"
                Product: "${description}"
                Return only a number (the total pounds per case) or "unknown".`
    }]
  });
  
  const result = response.content[0].text.trim();
  return result === 'unknown' ? null : parseFloat(result);
}
```

### 7.2 Margin Management

**Per-Item Margin Override**:

```javascript
// MarginEditor.jsx
export function MarginEditor({ products, onUpdate }) {
  const [margins, setMargins] = useState(
    products.reduce((acc, p) => ({ ...acc, [p.id]: 15.0 }), {})
  );

  const handleMarginChange = (productId, value) => {
    setMargins(prev => ({ ...prev, [productId]: parseFloat(value) }));
  };

  const applyBulkMargin = (margin) => {
    const updated = Object.keys(margins).reduce(
      (acc, id) => ({ ...acc, [id]: margin }), {}
    );
    setMargins(updated);
  };

  return (
    <div>
      <div className="bulk-controls">
        <label>Apply to all:</label>
        <input type="number" defaultValue={15} />
        <button onClick={() => applyBulkMargin(15)}>Apply 15%</button>
        <button onClick={() => applyBulkMargin(12)}>Apply 12%</button>
        <button onClick={() => applyBulkMargin(18)}>Apply 18%</button>
      </div>
      
      <table>
        <thead>
          <tr>
            <th>Product</th>
            <th>Cost/lb</th>
            <th>Margin %</th>
            <th>Margin $/lb</th>
          </tr>
        </thead>
        <tbody>
          {products.map(product => (
            <tr key={product.id}>
              <td>{product.description}</td>
              <td>${product.cost_per_lb.toFixed(4)}</td>
              <td>
                <input
                  type="number"
                  value={margins[product.id]}
                  onChange={(e) => handleMarginChange(product.id, e.target.value)}
                  step="0.5"
                  min="0"
                  max="100"
                />
              </td>
              <td>${(product.cost_per_lb * margins[product.id] / 100).toFixed(4)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

### 7.3 Price Sheet Generation

**Calculation Flow**:

```javascript
async function generatePriceSheet(zoneId, products, margins, supabase) {
  // Get freight rates for this zone
  const { data: freightRates } = await supabase
    .from('freight_rates')
    .select('*')
    .eq('destination_zone_id', zoneId)
    .gte('valid_until', new Date().toISOString());

  // Calculate delivered price for each product
  const priceItems = products.map(product => {
    const warehouseRate = freightRates.find(
      r => r.origin_warehouse_id === product.warehouse_id
    );
    
    const marginPercent = margins[product.id] || 15.0;
    const marginAmount = product.cost_per_lb * (marginPercent / 100);
    const freightPerLb = warehouseRate?.rate_per_lb || 0.25; // Default
    
    const deliveredPrice = product.cost_per_lb + marginAmount + freightPerLb;
    
    return {
      product_id: product.id,
      warehouse_id: product.warehouse_id,
      cost_per_lb: product.cost_per_lb,
      margin_percent: marginPercent,
      margin_amount: marginAmount,
      freight_per_lb: freightPerLb,
      delivered_price_lb: deliveredPrice
    };
  });

  // Create price sheet record
  const weekStart = getWeekStart(new Date());
  const weekEnd = getWeekEnd(new Date());

  const { data: priceSheet } = await supabase
    .from('price_sheets')
    .insert({
      zone_id: zoneId,
      week_start: weekStart,
      week_end: weekEnd,
      status: 'draft'
    })
    .select()
    .single();

  // Insert all price items
  await supabase
    .from('price_sheet_items')
    .insert(priceItems.map(item => ({
      ...item,
      price_sheet_id: priceSheet.id
    })));

  return priceSheet;
}
```

### 7.4 Export (Excel + PDF)

**Excel Generation**:

```javascript
// excelExport.js
import ExcelJS from 'exceljs';

export async function generatePriceSheetExcel(priceSheet, items, zone) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(`Zone ${zone.id} - ${zone.name}`);

  // Header styling
  sheet.mergeCells('A1:G1');
  sheet.getCell('A1').value = 'WEEKLY PRICE LIST';
  sheet.getCell('A1').font = { size: 16, bold: true };
  
  sheet.mergeCells('A2:G2');
  sheet.getCell('A2').value = `${zone.name} | Week of ${priceSheet.week_start}`;
  
  // Group by warehouse
  const warehouses = [...new Set(items.map(i => i.warehouse_id))];
  let currentRow = 4;

  for (const warehouseId of warehouses) {
    const warehouseItems = items.filter(i => i.warehouse_id === warehouseId);
    const warehouse = warehouseItems[0].warehouse;
    
    // Warehouse header
    sheet.getCell(`A${currentRow}`).value = `${warehouse.city}, ${warehouse.state}`;
    sheet.getCell(`A${currentRow}`).font = { bold: true, size: 12 };
    currentRow++;
    
    // Column headers
    const headers = ['Code', 'Description', 'Pack', 'Brand', 'Avail', '$/LB', 'Spec'];
    headers.forEach((h, i) => {
      const cell = sheet.getCell(currentRow, i + 1);
      cell.value = h;
      cell.font = { bold: true };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };
    });
    currentRow++;
    
    // Product rows
    for (const item of warehouseItems) {
      sheet.getCell(currentRow, 1).value = item.product.item_code;
      sheet.getCell(currentRow, 2).value = item.product.description;
      sheet.getCell(currentRow, 3).value = item.product.pack_size;
      sheet.getCell(currentRow, 4).value = item.product.brand;
      sheet.getCell(currentRow, 5).value = item.product.cases_available;
      sheet.getCell(currentRow, 6).value = item.delivered_price_lb;
      sheet.getCell(currentRow, 6).numFmt = '$0.00';
      
      if (item.product.spec_sheet_url) {
        sheet.getCell(currentRow, 7).value = { text: 'View', hyperlink: item.product.spec_sheet_url };
        sheet.getCell(currentRow, 7).font = { color: { argb: 'FF0000FF' }, underline: true };
      }
      currentRow++;
    }
    
    currentRow += 2; // Space between warehouses
  }

  // Set column widths
  sheet.columns = [
    { width: 10 }, { width: 40 }, { width: 12 },
    { width: 15 }, { width: 8 }, { width: 10 }, { width: 10 }
  ];

  return workbook;
}
```

**PDF Generation**:

```javascript
// pdfExport.jsx
import { Document, Page, Text, View, StyleSheet, Link } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 30 },
  header: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  subheader: { fontSize: 12, marginBottom: 20 },
  warehouseHeader: { fontSize: 14, fontWeight: 'bold', marginTop: 15, marginBottom: 5 },
  table: { display: 'table', width: '100%' },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
  tableHeader: { backgroundColor: '#F0F0F0' },
  cell: { padding: 5, fontSize: 9 },
  cellCode: { width: '10%' },
  cellDesc: { width: '35%' },
  cellPack: { width: '12%' },
  cellBrand: { width: '15%' },
  cellAvail: { width: '8%' },
  cellPrice: { width: '10%' },
  cellSpec: { width: '10%' },
  footer: { position: 'absolute', bottom: 30, left: 30, right: 30, fontSize: 8 }
});

export function PriceSheetPDF({ priceSheet, items, zone }) {
  const warehouses = [...new Set(items.map(i => i.warehouse_id))];
  
  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <Text style={styles.header}>WEEKLY PRICE LIST - {zone.name}</Text>
        <Text style={styles.subheader}>
          Week of {priceSheet.week_start} | Valid through {priceSheet.week_end}
        </Text>
        
        {warehouses.map(warehouseId => {
          const warehouseItems = items.filter(i => i.warehouse_id === warehouseId);
          const warehouse = warehouseItems[0].warehouse;
          
          return (
            <View key={warehouseId}>
              <Text style={styles.warehouseHeader}>
                {warehouse.city}, {warehouse.state}
              </Text>
              
              <View style={styles.table}>
                {/* Header row */}
                <View style={[styles.tableRow, styles.tableHeader]}>
                  <Text style={[styles.cell, styles.cellCode]}>Code</Text>
                  <Text style={[styles.cell, styles.cellDesc]}>Description</Text>
                  <Text style={[styles.cell, styles.cellPack]}>Pack</Text>
                  <Text style={[styles.cell, styles.cellBrand]}>Brand</Text>
                  <Text style={[styles.cell, styles.cellAvail]}>Avail</Text>
                  <Text style={[styles.cell, styles.cellPrice]}>$/LB</Text>
                  <Text style={[styles.cell, styles.cellSpec]}>Spec</Text>
                </View>
                
                {/* Data rows */}
                {warehouseItems.map(item => (
                  <View key={item.id} style={styles.tableRow}>
                    <Text style={[styles.cell, styles.cellCode]}>{item.product.item_code}</Text>
                    <Text style={[styles.cell, styles.cellDesc]}>{item.product.description}</Text>
                    <Text style={[styles.cell, styles.cellPack]}>{item.product.pack_size}</Text>
                    <Text style={[styles.cell, styles.cellBrand]}>{item.product.brand}</Text>
                    <Text style={[styles.cell, styles.cellAvail]}>{item.product.cases_available}</Text>
                    <Text style={[styles.cell, styles.cellPrice]}>
                      ${item.delivered_price_lb.toFixed(2)}
                    </Text>
                    <Text style={[styles.cell, styles.cellSpec]}>
                      {item.product.spec_sheet_url && (
                        <Link src={item.product.spec_sheet_url}>View</Link>
                      )}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          );
        })}
        
        <View style={styles.footer}>
          <Text>Terms: Net 30 | Minimum: 1 Pallet | Prices include delivery</Text>
          <Text>Freight estimates may vary ±15%. Temperature: 0°F to -10°F.</Text>
        </View>
      </Page>
    </Document>
  );
}
```

---

## 8. Application Screens

### 8.1 Dashboard
- Quick stats: Products uploaded, price sheets generated this week
- Recent activity log
- Freight rate status (last calibration date)

### 8.2 Inventory Upload
- Drag-and-drop Excel upload
- Column mapping preview
- Validation results (green/yellow/red)
- AI parsing status for edge cases

### 8.3 Product Management
- Table view of all products
- Filter by warehouse, category, brand
- Inline margin editing
- Bulk actions (apply margin to selection)

### 8.4 Price Sheet Builder
- Zone selector (tabs or dropdown)
- Preview table showing calculated prices
- Margin adjustment panel
- Generate button → Excel + PDF downloads

### 8.5 Customer Map
- Full-screen map with customer markers
- Zone overlay with color coding
- Lasso selection tool
- Customer detail sidebar
- Bulk zone assignment

### 8.6 Freight Management
- Current rates by lane
- Calibration status and history
- Manual rate override
- Comparison: estimated vs actual

### 8.7 Deal Inbox (AI-Powered)
- Forward manufacturer emails to dedicated address
- AI parses and extracts deal details
- Review and approve/reject parsed deals
- Convert approved deals to inventory

---

## 9. Supabase Edge Functions

### Function List

| Function | Trigger | Purpose |
|----------|---------|---------|
| `parse-document` | HTTP POST | AI document/email parsing |
| `normalize-address` | HTTP POST | AI address standardization |
| `calibrate-freight` | Scheduled (weekly) | GoShip API lane calibration |
| `generate-excel` | HTTP POST | Server-side Excel generation |
| `generate-pdf` | HTTP POST | Server-side PDF generation |
| `geocode-customers` | HTTP POST | Batch Mapbox geocoding |

### Deployment Structure

```
supabase/
├── functions/
│   ├── parse-document/
│   │   └── index.ts
│   ├── normalize-address/
│   │   └── index.ts
│   ├── calibrate-freight/
│   │   └── index.ts
│   ├── generate-excel/
│   │   └── index.ts
│   ├── generate-pdf/
│   │   └── index.ts
│   └── geocode-customers/
│       └── index.ts
├── migrations/
│   ├── 001_initial_schema.sql
│   ├── 002_add_indexes.sql
│   └── 003_rls_policies.sql
└── seed.sql
```

---

## 10. Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# Mapbox
NEXT_PUBLIC_MAPBOX_TOKEN=pk.xxx

# GoShip
GOSHIP_API_KEY=xxx

# Anthropic (Claude)
ANTHROPIC_API_KEY=sk-ant-xxx

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 11. Estimated Costs (Monthly)

| Service | Usage | Cost |
|---------|-------|------|
| Supabase | Free tier (500MB, 50K auth) | $0 |
| Mapbox | Free tier (50K loads, 100K geocodes) | $0 |
| GoShip | Per-shipment (quotes free) | $0 |
| Claude API | ~500K tokens | ~$5 |
| Vercel | Free tier | $0 |
| **Total** | | **~$5/month** |

*Scales with usage. Supabase Pro ($25/mo) if exceeding free tier.*

---

## 12. Development Milestones

### Week 1-2: Foundation
- [ ] Initialize Next.js project with Supabase
- [ ] Set up database schema and migrations
- [ ] Implement authentication
- [ ] Build inventory upload + parsing
- [ ] Create product table with margin editing

### Week 3-4: Pricing Engine
- [ ] Integrate GoShip API
- [ ] Implement freight estimation logic
- [ ] Build price calculation pipeline
- [ ] Create Excel export
- [ ] Create PDF export

### Week 5-6: Customer & Map
- [ ] Import customer data
- [ ] Set up Mapbox integration
- [ ] Implement customer map with clustering
- [ ] Build lasso selection tool
- [ ] Zone management UI

### Week 7-8: AI Features & Polish
- [ ] Integrate Claude for document parsing
- [ ] Build deal inbox feature
- [ ] Address normalization pipeline
- [ ] Dashboard and reporting
- [ ] Testing and refinement

---

## 13. File Structure

```
frozen-protein-pricing/
├── app/                          # Next.js App Router
│   ├── (auth)/
│   │   ├── login/
│   │   └── signup/
│   ├── (dashboard)/
│   │   ├── page.tsx              # Dashboard
│   │   ├── inventory/
│   │   │   ├── page.tsx          # Upload & manage
│   │   │   └── [id]/page.tsx     # Product detail
│   │   ├── pricing/
│   │   │   ├── page.tsx          # Price sheet builder
│   │   │   └── [zoneId]/page.tsx # Zone-specific view
│   │   ├── customers/
│   │   │   ├── page.tsx          # Customer list
│   │   │   └── map/page.tsx      # Map view
│   │   ├── freight/
│   │   │   └── page.tsx          # Rate management
│   │   └── deals/
│   │       └── page.tsx          # Deal inbox
│   ├── api/                      # API routes
│   │   ├── parse-document/
│   │   ├── export/
│   │   └── freight/
│   └── layout.tsx
├── components/
│   ├── ui/                       # Shared UI components
│   ├── inventory/
│   ├── pricing/
│   ├── map/
│   └── deals/
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── types.ts
│   ├── goship/
│   │   └── client.ts
│   ├── anthropic/
│   │   └── client.ts
│   ├── mapbox/
│   │   └── client.ts
│   └── utils/
│       ├── freight-calculator.ts
│       ├── pack-size-parser.ts
│       └── excel-parser.ts
├── supabase/
│   ├── functions/
│   ├── migrations/
│   └── seed.sql
├── public/
├── .env.local
├── package.json
└── README.md
```

---

*Final Project Plan v2.0*
*Last Updated: January 15, 2026*
