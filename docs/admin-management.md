# Admin Management

## Role policy

Only `SUPER_ADMIN` may create, deactivate, reactivate, or change the role of an `ADMIN`.

`ADMIN` may manage operational platform content according to existing permissions, but must never be able to create another admin or elevate any account to `SUPER_ADMIN`.

## Required controls

- Server-side authentication and SUPER_ADMIN authorization; UI hiding is not sufficient.
- Create admin with name, email, and initial access state.
- Send an account invitation/password setup flow rather than storing plaintext passwords.
- Prevent duplicate email identities.
- Prevent an ADMIN from invoking the endpoint directly.
- Prevent creation of SUPER_ADMIN through the admin-management endpoint.
- Audit every create, deactivate, reactivate, and role-change action.
- Require confirmation for destructive/deactivation actions.
- Never allow deletion of the final active SUPER_ADMIN.

## UI

Add `Admin Management` to the dashboard navigation for SUPER_ADMIN only.

Recommended fields:

- Name
- Email
- Status
- Role
- Created at
- Last sign-in
- Actions: deactivate/reactivate

The API must independently enforce the same authorization regardless of whether the navigation item is visible.
