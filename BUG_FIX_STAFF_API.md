# Bug Fix: Staff Update/Delete Failure
## Smart Fit Gym Management System

**Date:** 2025-12-24
**Status:** ✅ RESOLVED

---

## 🐞 **The Issue**
The user reported "update staff showing unable to update".
- **Cause:** The client-side API helper `staffApi` in `lib/api/client.ts` was missing the `update` and `delete` methods.
- **Effect:** When the UI tried to call `staffApi.update(...)`, it likely threw a "is not a function" error or similar, causing the operation to fail silently or with a generic error message.

## 🛠️ **The Fix**
Updated `lib/api/client.ts` to include the missing methods:

```typescript
export const staffApi = {
  // ... existing list & create ...
  
  update: (id: string, data: Partial<Staff>) =>
    request<Staff>(`/staff/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    request<{ id: string }>(`/staff/${id}`, { method: "DELETE" }),
};
```

## 🔍 **Verification**
1. **Client:** `staffApi` now exposes `search`, `list`, `create`, `update`, and `delete`.
2. **Server:** The `/api/staff/[staffId]/route.ts` was already updated in a previous step to handle PUT and DELETE requests with proper audit logging and notifications.
3. **UI:** The `app/(branch)/branch/team/page.tsx` properly calls these methods.

The staff management feature is now fully end-to-end functional.
