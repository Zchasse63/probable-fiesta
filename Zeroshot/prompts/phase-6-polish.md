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
