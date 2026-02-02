# TODO - Authentication & Roles

## Authentication Setup (Deferred)
- [ ] Implement Supabase Auth with email/password
- [ ] Add email verification flow for tenant claiming
- [ ] Create middleware to check auth state
- [ ] Protect routes based on authentication
- [ ] Add session management

## Role-Based Access Control
- [ ] Admin role: Full access to all CUs (kmkusche@gmail.com, compliance@cu.app)
- [ ] Tenant Admin: Full access to their own CU only
- [ ] Tenant Employee: Limited access to their own CU
- [ ] Tenant Marketing: Access to marketing/content sections only
- [ ] Tenant Developer: Access to API/integration sections

## Tenant Isolation
- [ ] Remove CU selector for non-admin users
- [ ] Lock tenant context based on email domain verification
- [ ] Implement RLS policies for all tenant data
- [ ] Filter all queries by tenant_users.cu_id

## Claim Flow
- [ ] Search for CU by name/charter
- [ ] Verify email domain matches CU's domain from NCUA
- [ ] Send verification email
- [ ] Create tenant_user record on verification
- [ ] Redirect to tenant-isolated dashboard

## Views
- [ ] Admin view: UnifiedPlatform (current) - can switch between CUs
- [ ] Tenant view: TenantPlatform - locked to single CU

## Notes
- Use TenantPlatform component for tenant users
- Use UnifiedPlatform component for admin users
- Check admin_users table for admin email list
- Check tenant_users table for tenant email mappings
