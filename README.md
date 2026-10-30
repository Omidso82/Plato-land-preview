# PLATO LAND — Preview

This is a public preview copy of the PLATO LAND tournament platform. The private main repository is separate and is not changed by this preview.

## Supabase preview connection

The preview is intentionally disconnected from the production Supabase project. To enable real signup/login, create a **separate Supabase project** for preview and configure these environment variables in the StackBlitz project:

- `REACT_APP_SUPABASE_URL`: the preview project's Project URL
- `REACT_APP_SUPABASE_ANON_KEY`: the preview project's publishable/anon key

Use only the publishable/anon key. **Never use a service_role or secret key in frontend code.** Do not connect this public preview to the production database.

The current app also reads the `profiles` and `user_roles` tables and a private `avatars` Storage bucket. Those must be created/configured in the preview project with appropriate Row Level Security policies before account/profile features can work. Do not copy production user data.

## Run locally

`npm install` then `npm start`.
