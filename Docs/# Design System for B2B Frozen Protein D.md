# Design System for B2B Frozen Protein Distribution Platform

This design system provides comprehensive, implementation-ready guidance for building a CRM and pricing platform for frozen protein distribution (chicken, beef, pork). Every specification is optimized for Claude Code implementation with exact Tailwind classes, color values, and component patterns.

---

## Color system built for logistics data density

A **blue-dominant palette** establishes trust and professionalism while associating with cold chain/frozen products. The system uses OKLCH colors (Tailwind v4 standard) with complete light/dark mode support and WCAG AA accessibility compliance.

### Primary brand colors

| Token | Light Mode | Dark Mode | Usage |
|-------|-----------|-----------|-------|
| `--primary` | `oklch(0.45 0.2 250)` | `oklch(0.65 0.18 250)` | Primary actions, links |
| `--primary-foreground` | `oklch(0.98 0 0)` | `oklch(0.12 0.005 250)` | Text on primary |
| `--secondary` | `oklch(0.96 0.005 250)` | `oklch(0.22 0.01 250)` | Secondary buttons |
| `--muted` | `oklch(0.96 0 0)` | `oklch(0.25 0.01 250)` | Subtle backgrounds |

### Semantic status colors with accessibility compliance

Status indicators require both color AND icon/shape for colorblind accessibility:

```css
/* Status colors - always pair with icons */
--status-success: oklch(0.55 0.18 145);    /* ✓ Delivered, Won deals */
--status-warning: oklch(0.75 0.15 85);     /* ⚠ Delayed, Needs attention */
--status-error: oklch(0.55 0.22 25);       /* ✕ Failed, Lost deals */
--status-info: oklch(0.55 0.2 250);        /* ● In transit, Processing */
--status-neutral: oklch(0.5 0 0);          /* ○ Pending, Not started */
```

### Product category accents for protein types

```css
--accent-frozen: oklch(0.6 0.18 220);   /* #0EA5E9 - Cold/frozen indicator */
--accent-beef: oklch(0.45 0.18 25);     /* #991B1B - Beef products */
--accent-pork: oklch(0.52 0.16 35);     /* #C2410C - Pork products */
--accent-poultry: oklch(0.6 0.15 75);   /* #D97706 - Chicken/poultry */
```

### Surface hierarchy for light and dark modes

```css
:root {
  --background: oklch(1 0 0);           /* Main background */
  --card: oklch(1 0 0);                 /* Card surfaces */
  --muted: oklch(0.96 0 0);             /* Lowered surfaces */
  --border: oklch(0.9 0 0);             /* Default borders */
  --foreground: oklch(0.145 0 0);       /* Primary text */
  --muted-foreground: oklch(0.5 0 0);   /* Secondary text */
}

.dark {
  --background: oklch(0.12 0.005 250);
  --card: oklch(0.18 0.005 250);
  --muted: oklch(0.25 0.01 250);
  --border: oklch(1 0 0 / 10%);
  --foreground: oklch(0.95 0 0);
  --muted-foreground: oklch(0.65 0 0);
}
```

**Critical accessibility rule**: Minimum **4.5:1** contrast ratio for all text on surfaces. Use `oklch(0.145 0 0)` text on white backgrounds, `oklch(0.95 0 0)` text on dark backgrounds.

---

## Glassmorphism applied strategically, not everywhere

Glass effects create visual hierarchy but harm readability on data-dense interfaces. Apply sparingly to **navigation and modals only**—never to data tables or forms.

### Where to use glass morphism

```html
<!-- Sticky navigation header with glass effect -->
<header class="sticky top-0 z-50 
               backdrop-blur-lg bg-background/80 
               border-b border-border/50 
               shadow-sm">
  <!-- Navigation content -->
</header>

<!-- Modal overlay -->
<div class="fixed inset-0 backdrop-blur-sm bg-black/40" />

<!-- Floating action panel -->
<aside class="backdrop-blur-md bg-card/90 border border-white/10 
              rounded-xl shadow-xl">
</aside>
```

### Glass morphism specifications

| Property | Light Mode | Dark Mode |
|----------|-----------|-----------|
| Background | `bg-white/60` to `bg-white/80` | `bg-slate-900/80` |
| Backdrop blur | `backdrop-blur-md` (12px) to `backdrop-blur-lg` (16px) | `backdrop-blur-lg` |
| Border | `border-white/20` | `border-white/10` |

### Where NOT to use glass morphism

- **Data tables**: Use solid `bg-card` for maximum readability
- **Form inputs**: Solid backgrounds ensure contrast compliance
- **Dense card grids**: Performance degrades with multiple blur elements
- **Small UI elements**: Buttons, badges, chips need solid fills

```html
<!-- DO: Solid table inside glass container -->
<div class="backdrop-blur-md bg-card/30 rounded-xl p-4">
  <table class="w-full bg-card rounded-lg">
    <!-- Solid background for table -->
  </table>
</div>
```

---

## Dashboard layout with tri-pane architecture

The logistics CRM uses a **fixed sidebar + flexible main content + contextual right panel** pattern common to Flexport, Salesforce, and HubSpot.

### Layout proportions and responsive behavior

| Component | Desktop (1440px+) | Laptop (1024-1440px) | Tablet |
|-----------|------------------|---------------------|---------|
| Left sidebar | 240-280px fixed | 64px collapsed | Drawer |
| Main content | Flexible (1fr) | Flexible | Full width |
| Right panel | 320-400px | Slide-over | Hidden |

### Implementation structure

```html
<div class="flex h-screen overflow-hidden">
  <!-- Sidebar navigation -->
  <aside class="hidden w-64 flex-shrink-0 border-r border-sidebar-border 
                bg-sidebar lg:block">
    <nav class="flex flex-col h-full p-4">
      <!-- Logo, nav items, user menu -->
    </nav>
  </aside>
  
  <!-- Main content area -->
  <main class="flex-1 flex flex-col overflow-hidden">
    <!-- Sticky header with glass effect -->
    <header class="sticky top-0 z-10 h-14 border-b border-border 
                   bg-background/95 backdrop-blur">
      <div class="flex items-center gap-4 px-6 h-full">
        <!-- Breadcrumbs, search, actions -->
      </div>
    </header>
    
    <!-- Scrollable content -->
    <div class="flex-1 overflow-y-auto p-6">
      <!-- Page content -->
    </div>
  </main>
  
  <!-- Context panel (appears on selection) -->
  <aside class="hidden xl:block w-96 border-l border-border bg-card 
                overflow-y-auto">
    <!-- Customer/deal details -->
  </aside>
</div>
```

### Map integration for delivery zones

Combine interactive maps with synchronized data tables:

```html
<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
  <!-- Map view -->
  <div class="h-[500px] rounded-lg border border-border overflow-hidden">
    <!-- Mapbox/Leaflet with customer pins color-coded by pricing tier -->
    <!-- Polygon overlays for Zone A/B/C pricing -->
  </div>
  
  <!-- Customer list (synced with map) -->
  <div class="overflow-auto">
    <table class="w-full">
      <!-- Customers with zone, tier, order frequency -->
    </table>
  </div>
</div>
```

---

## Pricing calculator with real-time feedback

The quote builder requires instant calculation updates, clear cost breakdowns, and margin visibility.

### Calculator layout pattern

```html
<div class="rounded-lg border border-border bg-card p-6 space-y-6">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <h2 class="text-lg font-semibold">Quote Calculator</h2>
    <Button variant="ghost" size="sm">Save Draft</Button>
  </div>
  
  <!-- Customer & zone selection -->
  <div class="grid grid-cols-2 gap-4">
    <Select label="Customer" />
    <div class="text-sm text-muted-foreground">
      Delivery Zone: <span class="font-medium text-foreground">Zone B</span>
    </div>
  </div>
  
  <!-- Product line items table -->
  <table class="w-full">
    <thead class="text-left text-sm text-muted-foreground">
      <tr>
        <th class="pb-2">Product</th>
        <th class="pb-2 text-right">Qty</th>
        <th class="pb-2 text-right">Unit $</th>
        <th class="pb-2 text-right">Line Total</th>
      </tr>
    </thead>
    <tbody class="divide-y divide-border">
      <!-- Editable line items -->
    </tbody>
  </table>
  
  <!-- Cost breakdown with margin indicator -->
  <div class="bg-muted rounded-lg p-4 space-y-2">
    <div class="flex justify-between text-sm">
      <span>Product Subtotal</span>
      <span class="tabular-nums font-medium">$9,795.00</span>
    </div>
    <div class="flex justify-between text-sm">
      <span>Freight (Zone B - 45 miles)</span>
      <span class="tabular-nums">$185.00</span>
    </div>
    <div class="border-t border-border pt-2 flex justify-between font-semibold">
      <span>Total</span>
      <span class="tabular-nums">$10,011.36</span>
    </div>
    <!-- Margin indicator with color coding -->
    <div class="flex items-center gap-4 pt-2 text-sm">
      <span class="text-muted-foreground">Margin:</span>
      <span class="font-medium text-success">22.4%</span>
      <span class="text-muted-foreground">GP:</span>
      <span class="tabular-nums">$2,242.54</span>
    </div>
  </div>
  
  <!-- Actions -->
  <div class="flex gap-3">
    <Button>Create Order</Button>
    <Button variant="secondary">Send Quote</Button>
  </div>
</div>
```

**Margin color thresholds**: Red (`text-destructive`) < 15%, Yellow (`text-warning`) 15-20%, Green (`text-success`) > 20%

---

## Data table patterns optimized for pricing and logistics

Data tables are the most critical component for this platform. Every specification targets maximum scannability and efficient data entry.

### Typography for numerical data

```css
/* Use tabular figures for aligned columns */
.tabular-nums { font-variant-numeric: tabular-nums lining-nums; }
.slashed-zero { font-variant-numeric: slashed-zero; }
```

| Data Type | Alignment | Tailwind Classes |
|-----------|-----------|------------------|
| Currency/Amounts | Right | `text-right tabular-nums` |
| Percentages | Right | `text-right tabular-nums` |
| Quantities | Right | `text-right tabular-nums` |
| Dates | Left | `text-left` |
| Status/Text | Left | `text-left` |

### Currency cell component

```tsx
const CurrencyCell = ({ value, isNegative }: { value: number; isNegative?: boolean }) => (
  <td className={cn(
    "tabular-nums lining-nums text-right pr-4 font-mono text-sm",
    isNegative ? "text-destructive" : "text-foreground"
  )}>
    {isNegative ? `(${Math.abs(value).toFixed(2)})` : `$${value.toFixed(2)}`}
  </td>
);
```

### Table row interactions

```html
<tbody class="divide-y divide-border">
  <tr class="group hover:bg-muted/50 transition-colors cursor-pointer
             data-[selected=true]:bg-primary/5 data-[selected=true]:border-l-2 
             data-[selected=true]:border-l-primary">
    <!-- Checkbox appears on hover -->
    <td class="w-10 px-3">
      <input type="checkbox" 
             class="opacity-0 group-hover:opacity-100 
                    data-[selected=true]:opacity-100" />
    </td>
    <td class="px-4 py-3 text-sm">Content</td>
    <!-- Row actions appear on hover -->
    <td class="px-4 py-3">
      <div class="opacity-0 group-hover:opacity-100 flex gap-1">
        <Button variant="ghost" size="icon">Edit</Button>
        <Button variant="ghost" size="icon">Delete</Button>
      </div>
    </td>
  </tr>
</tbody>
```

### Inline editing pattern

```tsx
const InlineEditCell = ({ value, onSave }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  
  if (!isEditing) {
    return (
      <td 
        onClick={() => setIsEditing(true)}
        className="tabular-nums text-right cursor-pointer hover:bg-muted/30 px-4 py-3"
      >
        ${value.toFixed(2)}
        <PencilIcon className="inline ml-1 h-3 w-3 opacity-0 group-hover:opacity-50" />
      </td>
    );
  }
  
  return (
    <td className="px-2 py-1">
      <input
        type="number"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={() => { onSave(editValue); setIsEditing(false); }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') { onSave(editValue); setIsEditing(false); }
          if (e.key === 'Escape') { setEditValue(value); setIsEditing(false); }
        }}
        className="w-full text-right tabular-nums border rounded px-2 py-1 
                   focus:ring-2 focus:ring-ring"
        autoFocus
      />
    </td>
  );
};
```

### Sticky headers and columns for wide tables

```html
<div class="overflow-auto max-h-[calc(100vh-200px)] border rounded-lg">
  <table class="w-full border-collapse min-w-[800px]">
    <thead class="sticky top-0 z-10 bg-muted">
      <tr>
        <th class="sticky left-0 z-20 bg-muted px-4 py-3 text-left text-sm font-medium">
          Customer
        </th>
        <th class="px-4 py-3 text-right text-sm font-medium">Zone</th>
        <!-- More headers -->
      </tr>
    </thead>
    <tbody class="divide-y divide-border">
      <tr class="hover:bg-muted/50">
        <td class="sticky left-0 bg-card px-4 py-3 text-sm font-medium">
          ABC Restaurant Group
        </td>
        <!-- More cells -->
      </tr>
    </tbody>
  </table>
</div>
```

---

## Deal card and pipeline patterns

Deal cards display opportunity value, customer context, and next actions at a glance.

### Deal card anatomy

```html
<div class="rounded-lg border border-border bg-card p-4 space-y-3 
            hover:shadow-md transition-shadow cursor-pointer">
  <!-- Header: Customer + Priority -->
  <div class="flex items-start justify-between">
    <div>
      <h3 class="font-medium text-sm">ABC Restaurant Group</h3>
      <p class="text-xs text-muted-foreground">Hotel Chain · 150 cases/week</p>
    </div>
    <StarIcon class="h-4 w-4 text-warning" /> <!-- Priority indicator -->
  </div>
  
  <!-- Value + Close date -->
  <div class="flex items-baseline gap-4">
    <span class="text-xl font-bold tabular-nums">$45,000</span>
    <span class="text-xs text-muted-foreground">Close: Mar 15</span>
  </div>
  
  <!-- Probability bar -->
  <div class="h-1.5 bg-muted rounded-full overflow-hidden">
    <div class="h-full bg-primary rounded-full" style="width: 65%"></div>
  </div>
  
  <!-- Owner + Next action -->
  <div class="flex items-center justify-between text-xs">
    <div class="flex items-center gap-2">
      <Avatar size="xs" />
      <span class="text-muted-foreground">Sarah M.</span>
    </div>
    <span class="text-warning flex items-center gap-1">
      <AlertIcon class="h-3 w-3" />
      Follow-up overdue
    </span>
  </div>
</div>
```

### Pipeline stage colors

```css
--stage-lead: oklch(0.5 0 0);         /* Gray - New lead */
--stage-qualified: oklch(0.55 0.2 250); /* Blue - Qualified */
--stage-proposal: oklch(0.55 0.18 300); /* Purple - Proposal sent */
--stage-negotiation: oklch(0.6 0.16 55); /* Orange - In negotiation */
--stage-won: oklch(0.55 0.18 145);     /* Green - Won */
--stage-lost: oklch(0.55 0.22 25);     /* Red - Lost */
```

---

## Order tracking and status visualization

Shipment tracking uses vertical timelines with temperature monitoring for frozen products.

### Tracking timeline component

```html
<div class="space-y-4">
  <!-- Completed step -->
  <div class="flex gap-4">
    <div class="flex flex-col items-center">
      <div class="h-8 w-8 rounded-full bg-success flex items-center justify-center">
        <CheckIcon class="h-4 w-4 text-success-foreground" />
      </div>
      <div class="flex-1 w-0.5 bg-success mt-2"></div>
    </div>
    <div class="pb-6">
      <p class="font-medium text-sm">Order Received</p>
      <p class="text-xs text-muted-foreground">Mar 12, 2026 8:30 AM</p>
      <p class="text-xs text-muted-foreground mt-1">Confirmed by Sarah M.</p>
    </div>
  </div>
  
  <!-- Current step -->
  <div class="flex gap-4">
    <div class="flex flex-col items-center">
      <div class="h-8 w-8 rounded-full bg-primary flex items-center justify-center 
                  ring-4 ring-primary/20">
        <TruckIcon class="h-4 w-4 text-primary-foreground animate-pulse" />
      </div>
      <div class="flex-1 w-0.5 bg-border mt-2"></div>
    </div>
    <div class="pb-6">
      <p class="font-medium text-sm">In Transit</p>
      <p class="text-xs text-muted-foreground">Mar 13, 2026 7:15 AM</p>
      <p class="text-xs text-muted-foreground mt-1">Driver: Mike T. · ETA: 9:30 AM</p>
      <!-- Temperature monitor -->
      <div class="mt-2 inline-flex items-center gap-2 px-2 py-1 bg-accent-frozen/10 
                  rounded text-xs">
        <ThermometerIcon class="h-3 w-3 text-accent-frozen" />
        <span class="tabular-nums">-12°F</span>
        <span class="text-success">✓ In range</span>
      </div>
    </div>
  </div>
  
  <!-- Pending step -->
  <div class="flex gap-4">
    <div class="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
      <span class="h-2 w-2 rounded-full bg-muted-foreground"></span>
    </div>
    <div>
      <p class="font-medium text-sm text-muted-foreground">Delivered</p>
      <p class="text-xs text-muted-foreground">Pending signature</p>
    </div>
  </div>
</div>
```

---

## Animation with Framer Motion spring configurations

Motion design supports user understanding without slowing down power users. All animations respect `prefers-reduced-motion`.

### Spring presets for different interactions

```typescript
// springs.ts - Export these for consistent usage
export const springs = {
  // Snappy - buttons, tooltips, micro-interactions
  snappy: { type: "spring", stiffness: 400, damping: 30 },
  
  // Smooth - modals, page transitions
  smooth: { type: "spring", stiffness: 260, damping: 20 },
  
  // Gentle - number counters, data updates
  gentle: { type: "spring", stiffness: 100, damping: 15, mass: 0.8 },
  
  // Drawer - side panels, context panels
  drawer: { type: "spring", stiffness: 380, damping: 32 },
};
```

### When to animate vs. instant

| Scenario | Animate? | Duration |
|----------|----------|----------|
| Hover/focus states | Yes | 100-150ms |
| Button press | Yes | 100-200ms |
| Modal open/close | Yes | 250-400ms |
| Data updates in tables | Subtle fade | 150-200ms |
| Form validation errors | Shake animation | 400ms |
| Page transitions | Yes | 300-400ms |
| Real-time price changes | Number counter | 300-600ms |
| Critical error alerts | Instant | 0ms |

### Animated number component for prices

```tsx
import { useSpring, useTransform, motion } from "framer-motion";

function AnimatedPrice({ value }: { value: number }) {
  const spring = useSpring(value, springs.gentle);
  
  const display = useTransform(spring, (current) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(current)
  );

  useEffect(() => { spring.set(value); }, [spring, value]);

  return <motion.span className="tabular-nums">{display}</motion.span>;
}
```

### Staggered list animation for deal lists

```tsx
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.04 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: springs.snappy,
  },
};

const DealList = ({ deals }) => (
  <motion.div variants={containerVariants} initial="hidden" animate="visible">
    {deals.map((deal) => (
      <motion.div key={deal.id} variants={itemVariants}>
        <DealCard deal={deal} />
      </motion.div>
    ))}
  </motion.div>
);
```

### Loading states for freight calculations

```tsx
const FreightQuoteLoader = ({ isLoading, result }) => (
  <AnimatePresence mode="wait">
    {isLoading ? (
      <motion.div
        key="skeleton"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="space-y-3"
      >
        {/* Skeleton shimmer */}
        <div className="h-4 bg-muted rounded animate-pulse" />
        <div className="h-8 bg-muted rounded animate-pulse" />
      </motion.div>
    ) : (
      <motion.div
        key="content"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={springs.smooth}
      >
        <span className="text-2xl font-bold tabular-nums">
          ${result.total.toFixed(2)}
        </span>
      </motion.div>
    )}
  </AnimatePresence>
);
```

---

## CLAUDE.md file for AI code generation

Create this file at your project root for Claude Code context:

```markdown
# Design System Context for AI Assistants

## Overview
B2B logistics platform for frozen protein distribution. Uses React, TypeScript, Tailwind CSS v4, and Shadcn/UI.

## Component Locations
- UI primitives: `/src/components/ui/`
- Domain components: `/src/components/logistics/`
- Layout components: `/src/components/layout/`

## Styling Patterns
- All components use Tailwind CSS utility classes
- Design tokens in `/src/styles/tokens.css`
- Use `cn()` utility from `/lib/utils` for class merging
- Variants use `cva()` from class-variance-authority

## Code Standards
- TypeScript strict mode - always define prop interfaces
- Export both component and type definitions
- Include `data-testid` for testing
- All interactive elements need keyboard support
- Currency: always use tabular-nums, right-align, 2 decimal places

## Component Pattern Example
\`\`\`tsx
import { cn } from '@/lib/utils'
import { cva, type VariantProps } from 'class-variance-authority'

const componentVariants = cva('base-classes', {
  variants: {
    variant: { primary: '...', secondary: '...' },
    size: { sm: '...', md: '...', lg: '...' },
  },
  defaultVariants: { variant: 'primary', size: 'md' },
})

interface ComponentProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof componentVariants> {}

export function Component({ className, variant, size, ...props }: ComponentProps) {
  return (
    <element className={cn(componentVariants({ variant, size }), className)} {...props} />
  )
}
\`\`\`

## Domain-Specific Rules
- Shipment IDs: `SHP-XXXXXX` format
- Order IDs: `ORD-XXXXXX` format
- Currency: USD with 2 decimals ($1,234.56)
- Weight: pounds (lbs), dimensions: inches
- Temperatures: Fahrenheit with ° symbol
- Status colors: always pair with icons (accessibility)

## Animation Standards
- Use Framer Motion springs, not duration-based
- Snappy spring: { stiffness: 400, damping: 30 }
- Smooth spring: { stiffness: 260, damping: 20 }
- Always check useReducedMotion()
```

---

## Complete Tailwind v4 theme configuration

```css
/* app/globals.css */
@import "tailwindcss";

@theme {
  /* Typography */
  --font-sans: "Inter", system-ui, sans-serif;
  --font-mono: "JetBrains Mono", monospace;
  
  /* Border radius */
  --radius-sm: 0.25rem;
  --radius-md: 0.375rem;
  --radius-lg: 0.5rem;
  --radius-xl: 0.75rem;
  
  /* Custom shadows */
  --shadow-card: 0 1px 3px 0 rgb(0 0 0 / 0.1);
  --shadow-dropdown: 0 4px 6px -1px rgb(0 0 0 / 0.1);
}

:root {
  --radius: 0.5rem;
  
  /* Surfaces */
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.145 0 0);
  --muted: oklch(0.96 0 0);
  --muted-foreground: oklch(0.5 0 0);
  
  /* Brand */
  --primary: oklch(0.45 0.2 250);
  --primary-foreground: oklch(0.98 0 0);
  --secondary: oklch(0.96 0.005 250);
  --secondary-foreground: oklch(0.25 0.02 250);
  --accent: oklch(0.96 0.01 250);
  --accent-foreground: oklch(0.25 0.02 250);
  
  /* Semantic */
  --destructive: oklch(0.55 0.22 25);
  --success: oklch(0.55 0.18 145);
  --warning: oklch(0.75 0.15 85);
  --info: oklch(0.55 0.2 250);
  
  /* Borders */
  --border: oklch(0.9 0 0);
  --input: oklch(0.9 0 0);
  --ring: oklch(0.45 0.2 250);
  
  /* Sidebar */
  --sidebar: oklch(0.98 0.005 250);
  --sidebar-foreground: oklch(0.25 0 0);
  --sidebar-border: oklch(0.92 0.005 250);
  
  /* Charts */
  --chart-1: oklch(0.55 0.2 250);
  --chart-2: oklch(0.65 0.18 180);
  --chart-3: oklch(0.6 0.15 320);
  --chart-4: oklch(0.7 0.16 85);
  --chart-5: oklch(0.5 0.12 30);
  
  /* Product accents */
  --accent-frozen: oklch(0.6 0.18 220);
  --accent-beef: oklch(0.45 0.18 25);
  --accent-pork: oklch(0.52 0.16 35);
  --accent-poultry: oklch(0.6 0.15 75);
}

.dark {
  --background: oklch(0.12 0.005 250);
  --foreground: oklch(0.95 0 0);
  --card: oklch(0.18 0.005 250);
  --card-foreground: oklch(0.95 0 0);
  --muted: oklch(0.25 0.01 250);
  --muted-foreground: oklch(0.65 0 0);
  
  --primary: oklch(0.65 0.18 250);
  --primary-foreground: oklch(0.12 0.005 250);
  --secondary: oklch(0.22 0.01 250);
  --secondary-foreground: oklch(0.95 0 0);
  
  --border: oklch(1 0 0 / 10%);
  --input: oklch(1 0 0 / 12%);
  --ring: oklch(0.65 0.18 250);
  
  --sidebar: oklch(0.15 0.005 250);
  --sidebar-border: oklch(1 0 0 / 8%);
}

/* Register custom colors for utility classes */
@theme inline {
  --color-success: var(--success);
  --color-warning: var(--warning);
  --color-frozen: var(--accent-frozen);
  --color-beef: var(--accent-beef);
  --color-pork: var(--accent-pork);
  --color-poultry: var(--accent-poultry);
}
```

---

## Component naming conventions

| Category | Convention | Examples |
|----------|------------|----------|
| Components | PascalCase | `DataTable`, `DealCard`, `ShipmentTracker` |
| Props/Variables | camelCase | `isLoading`, `shipmentId`, `onPriceChange` |
| Boolean props | is/has prefix | `isEditing`, `hasError`, `isSelected` |
| Event handlers | handle prefix | `handleSubmit`, `handlePriceUpdate` |
| CSS classes | kebab-case | `price-cell`, `deal-card-header` |
| Constants | SCREAMING_SNAKE | `MAX_LINE_ITEMS`, `DEFAULT_MARGIN` |
| Hooks | use prefix | `useFreightQuote`, `useCustomerSearch` |

### Domain-specific component names

```
ShipmentCard, ShipmentTracker, ShipmentTimeline
DealCard, DealPipeline, DealDetails
CustomerProfile, CustomerSelector, CustomerMap
FreightCalculator, FreightQuoteCard, FreightZoneMap
PricingTable, PricingCalculator, MarginIndicator
OrderStatusBadge, OrderTimeline, OrderDetails
InventoryTable, InventoryAlert, StockLevel
ZonePricingMap, ZoneSelector, ZoneBadge
```

---

## Conclusion: Implementation priorities

This design system prioritizes **data density and professional usability** over decorative elements. When implementing with Claude Code, follow these priorities:

1. **Start with the color token system** - copy the complete CSS variables into globals.css
2. **Build the DataTable component first** - it's used most frequently and establishes patterns
3. **Implement the tri-pane layout** - sets the application structure
4. **Add the pricing calculator** - core business functionality
5. **Create the CLAUDE.md file** - ensures consistent AI-generated code

The **blue-dominant palette** associates with cold chain logistics while projecting professionalism. **Glass morphism appears only on navigation** to maintain readability in data-dense views. **Tabular numbers and right-aligned currency** enable rapid scanning of pricing data. **Framer Motion springs** provide responsive feedback without slowing power users.

Every specification includes exact Tailwind classes and color values for direct implementation—no interpretation required.
