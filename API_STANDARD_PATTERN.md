# API Routes - Notification & Audit Logging Standard Pattern
## Based on /api/leads/route.ts Analysis

**Date:** 2025-12-24
**Status:** ✅ REFERENCE PATTERN

---

## ✅ Perfect Implementation Example

The `/api/leads/route.ts` demonstrates the **ideal pattern** for implementing notifications and audit logging across all API routes.

### **Key Components:**

#### 1. **Authentication & Authorization**
```typescript
const auth = await requireSession(["super_admin", "branch_admin"]);
if ("response" in auth) return auth.response;
```

#### 2. **Branch Scope Resolution**
```typescript
const scoped = resolveBranchScope(auth.session, requestedBranchId);
if ("response" in scoped) return scoped.response;

if (!scoped.branchId) {
  return errorResponse("branchId is required", 422);
}
```

#### 3. **Actor Information**
```typescript
const actor = await getRequestUser();
const ipAddress = getRequestIp(request);
```

#### 4. **Audit Logging**
```typescript
auditService.logAction({
  userId: actor.userId,
  userName: actor.userName,
  action: "create_lead",           // Action name
  resource: "lead",                 // Resource type
  resourceId: result.data?.id || "unknown",
  details: (result.data || {}) as unknown as Record<string, unknown>,
  ipAddress,
  branchId: scoped.branchId,       // ✅ Branch context
});
```

#### 5. **Notifications (Repository Pattern)**
```typescript
// Notify Branch Admins about new lead
if (result.success && result.data && scoped.branchId) {
  try {
    const { userRepository, notificationRepository } = await import("@/modules/database");
    const branchAdmins = await userRepository.findByBranchAsync(scoped.branchId);
    const adminUsers = branchAdmins.filter(u => u.role === "branch_admin");

    for (const admin of adminUsers) {
      await notificationRepository.createAsync({
        userId: admin.id,
        type: "lead_assigned" as const,
        title: "New Lead Generated",
        message: `New lead: ${result.data.name}`,
        priority: "medium" as const,
        status: "unread" as const,
        read: false,
        data: { leadId: result.data.id },
        branchId: scoped.branchId,
      });
    }
  } catch (notifError) {
    console.error("[Leads] Failed to create notifications:", notifError);
    // Don't fail the request if notifications fail
  }
}
```

---

## 🎯 **Standard Pattern Template**

### **For POST/PUT/DELETE Operations:**

```typescript
export async function POST(request: NextRequest) {
  try {
    // 1. Authentication
    const auth = await requireSession(["super_admin", "branch_admin"]);
    if ("response" in auth) return auth.response;

    // 2. Parse and validate body
    const body = await parseBody<Record<string, unknown>>(request);
    const validation = schema.safeParse(body);
    if (!validation.success) {
      return errorResponse(validation.error.issues[0]?.message || "Validation failed", 422);
    }

    // 3. Resolve branch scope
    const requestedBranchId = typeof body.branchId === "string" ? body.branchId : undefined;
    const scoped = resolveBranchScope(auth.session, requestedBranchId);
    if ("response" in scoped) return scoped.response;

    if (!scoped.branchId) {
      return errorResponse("branchId is required", 422);
    }

    // 4. Perform the operation
    const result = await service.createResource({
      ...validation.data,
      branchId: scoped.branchId,
    });

    if (!result.success) {
      return errorResponse(result.error || "Failed to create resource", 409);
    }

    // 5. Get actor information
    const actor = await getRequestUser();
    const ipAddress = getRequestIp(request);

    // 6. Audit logging
    auditService.logAction({
      userId: actor.userId,
      userName: actor.userName,
      action: "create_resource",
      resource: "resource_type",
      resourceId: result.data?.id || "unknown",
      details: (result.data || {}) as unknown as Record<string, unknown>,
      ipAddress,
      branchId: scoped.branchId,
    });

    // 7. Notifications (if applicable)
    if (result.success && result.data && scoped.branchId) {
      try {
        const { userRepository, notificationRepository } = await import("@/modules/database");
        const branchAdmins = await userRepository.findByBranchAsync(scoped.branchId);
        const adminUsers = branchAdmins.filter(u => u.role === "branch_admin");

        for (const admin of adminUsers) {
          await notificationRepository.createAsync({
            userId: admin.id,
            type: "system_announcement" as const,
            title: "Resource Created",
            message: `New ${resource}: ${result.data.name}`,
            priority: "medium" as const,
            status: "unread" as const,
            read: false,
            data: { resourceId: result.data.id },
            branchId: scoped.branchId,
          });
        }
      } catch (notifError) {
        console.error("[Resource] Failed to create notifications:", notifError);
      }
    }

    // 8. Return success
    return successResponse(result.data, "Resource created successfully", 201);

  } catch (error) {
    console.error("Create resource error:", error);
    return errorResponse("Failed to create resource", 500);
  }
}
```

---

## ✅ **Checklist for All API Routes**

### **Required Elements:**
- [ ] Authentication via `requireSession()`
- [ ] Branch scope resolution via `resolveBranchScope()`
- [ ] Actor information via `getRequestUser()` and `getRequestIp()`
- [ ] Audit logging with all required fields including `branchId`
- [ ] Notifications using repository pattern (not NotificationService)
- [ ] Error handling with try-catch for notifications
- [ ] Console logging for debugging
- [ ] Proper error responses

### **Audit Log Requirements:**
- [ ] `userId` - Actor's user ID
- [ ] `userName` - Actor's name
- [ ] `action` - Descriptive action name (e.g., "create_lead")
- [ ] `resource` - Resource type (e.g., "lead")
- [ ] `resourceId` - ID of the affected resource
- [ ] `details` - Full resource data or relevant details
- [ ] `ipAddress` - Request IP address
- [ ] `branchId` - ✅ **Critical: Branch context**

### **Notification Requirements:**
- [ ] Use `userRepository.findByBranchAsync()` to get branch admins
- [ ] Filter for `role === "branch_admin"`
- [ ] Use `notificationRepository.createAsync()` (not NotificationService)
- [ ] Include all required fields:
  - `userId` - Admin's ID
  - `type` - Notification type
  - `title` - Short title
  - `message` - Descriptive message
  - `priority` - low, medium, or high
  - `status` - "unread"
  - `read` - false
  - `data` - Contextual data
  - `branchId` - ✅ **Branch context**
- [ ] Wrap in try-catch to prevent request failure
- [ ] Log errors with console.error

---

## 📊 **API Routes Audit Status**

### ✅ **Fully Compliant Routes:**
| Route | Audit | Notification | Pattern | Status |
|-------|-------|--------------|---------|--------|
| POST /api/leads | ✅ | ✅ | ✅ | **PERFECT** |
| POST /api/members | ✅ | ✅ | ✅ | Good |
| POST /api/staff | ✅ | ✅ | ✅ | Good |
| POST /api/devices | ✅ | ✅ | ✅ | Good |
| POST /api/classes | ✅ | ✅ | ✅ | Good |
| POST /api/payments | ✅ | ✅ | ✅ | Good |
| POST /api/members/[id]/block | ✅ | ✅ | ✅ | Good |
| POST /api/members/[id]/unblock | ✅ | ✅ | ✅ | Good |
| POST /api/devices/[id]/flash | ✅ | ✅ | ✅ | Good |
| POST /api/devices/[id]/reboot | ✅ | ✅ | ✅ | Good |
| POST /api/devices/[id]/sync | ✅ | ✅ | ✅ | Good |

### ⚠️ **Routes to Review:**
| Route | Issue | Action Needed |
|-------|-------|---------------|
| POST /api/branches | Review | Verify pattern compliance |
| POST /api/plans | Review | Verify pattern compliance |
| POST /api/expenses | Review | Check notification needs |
| POST /api/communications | Review | Verify pattern compliance |

---

## 🔍 **Common Mistakes to Avoid**

### ❌ **DON'T:**
1. Use `NotificationService` in API routes (causes URL parsing errors)
2. Forget to include `branchId` in audit logs
3. Forget to include `branchId` in notifications
4. Let notification failures break the main request
5. Use static imports for repositories (use dynamic imports)
6. Forget error handling for notifications
7. Skip branch scope validation
8. Hardcode branch IDs

### ✅ **DO:**
1. Use repository pattern (`userRepository`, `notificationRepository`)
2. Always include `branchId` in audit logs and notifications
3. Wrap notifications in try-catch blocks
4. Use dynamic imports: `await import("@/modules/database")`
5. Log notification errors with console.error
6. Validate branch scope before operations
7. Get actor information for audit trails
8. Use proper TypeScript typing with `as const`

---

## 🎨 **Notification Types & Priorities**

### **Notification Types:**
- `system_announcement` - System-wide announcements
- `lead_assigned` - New leads
- `payment_received` - Payment confirmations
- `branch_update` - Branch-related updates
- `alert` - Urgent alerts

### **Priority Levels:**
- `high` - Urgent actions (security, critical failures)
- `medium` - Important but not urgent (new resources, updates)
- `low` - Informational (routine operations, syncs)

### **Guidelines:**
| Action | Type | Priority | Rationale |
|--------|------|----------|-----------|
| Member blocked | system_announcement | medium | Important security action |
| Member unblocked | system_announcement | low | Routine restoration |
| New lead | lead_assigned | medium | Requires follow-up |
| New member | system_announcement | medium | Important milestone |
| New staff | branch_update | medium | Team change |
| Payment received | payment_received | medium | Financial transaction |
| Device flash | system_announcement | medium | System maintenance |
| Device reboot | system_announcement | low | Routine operation |
| Device sync | system_announcement | low | Background task |

---

## 🚀 **Implementation Workflow**

### **For New API Routes:**
1. Copy the template above
2. Replace placeholders with actual values
3. Determine appropriate notification type and priority
4. Add route to audit status table
5. Test authentication and authorization
6. Verify audit logs are created
7. Verify notifications are sent
8. Test error handling

### **For Existing Routes:**
1. Review against checklist
2. Add missing elements
3. Update to repository pattern if needed
4. Add branchId to audit logs if missing
5. Add branchId to notifications if missing
6. Add error handling if missing
7. Test thoroughly
8. Update documentation

---

## 📝 **Code Review Guidelines**

### **When reviewing PRs, check:**
- [ ] All POST/PUT/DELETE operations have audit logging
- [ ] Audit logs include `branchId`
- [ ] Notifications use repository pattern
- [ ] Notifications include `branchId`
- [ ] Error handling is present
- [ ] Branch scope is validated
- [ ] Actor information is captured
- [ ] Proper TypeScript typing
- [ ] Console logging for debugging
- [ ] No NotificationService usage in API routes

---

## 🎯 **Summary**

### **The `/api/leads/route.ts` pattern is perfect because:**
1. ✅ Complete authentication and authorization
2. ✅ Proper branch scope resolution
3. ✅ Actor information capture
4. ✅ Comprehensive audit logging with branchId
5. ✅ Repository-based notifications
6. ✅ Error handling for notifications
7. ✅ Proper error logging
8. ✅ No URL parsing issues
9. ✅ Follows TypeScript best practices
10. ✅ Maintainable and testable

### **Use this pattern for all API routes!**

---

**Last Updated:** 2025-12-24 16:55 IST
**Status:** ✅ REFERENCE STANDARD
