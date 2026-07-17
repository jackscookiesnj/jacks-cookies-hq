# Jack's Cookies HQ

Version 1 of Jack's Cookies HQ is a mobile-first Next.js app for managing cookie customers, orders, invoices, production, and delivery planning.

## Setup

1. Copy `.env.example` to `.env.local`.
2. Add the configured Supabase project values:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Run the SQL in `supabase/migrations/001_jacks_cookies_hq.sql` against the Supabase database.
4. Install and run:

```bash
pnpm install
pnpm dev
```

## Notes

- Supabase is the source of truth for customers, orders, invoice references, and wholesale invoice sequences.
- Wholesale invoice numbers are allocated by the `allocate_wholesale_invoice` database function.
- Individual invoice references use `Customer Name - Month Day, Year`.
- If env vars are missing, the app renders a preview dataset so the interface can still be reviewed locally.
