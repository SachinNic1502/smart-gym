# Complete CRUD Operations - Audit & Notification Pattern
## Smart Fit Gym Management System

**Date:** 2025-12-24
**Status:** ✅ LEADS ROUTES COMPLETE

---

## ✅ Leads Routes - Now 100% Complete

### **POST /api/leads** (CREATE)
- ✅ Authentication & Authorization
- ✅ Branch Scope Resolution
- ✅ Audit Logging with branchId
- ✅ **Notifications** to branch admins
- **Priority:** `medium` (new leads need follow-up)

### **PUT /api/leads/[leadId]** (UPDATE)
- ✅ Authentication & Authorization
- ✅ Branch Scope Resolution
- ✅ Audit Logging with branchId
- ✅ **Notifications** to branch admins ← **ADDED**
- **Priority:** `low` (informational update)

### **DELETE /api/leads/[leadId]** (DELETE)
- ✅ Authentication & Authorization
- ✅ Branch Scope Resolution
- ✅ Audit Logging with branchId
- ✅ **Notifications** to branch admins ← **ADDED**
- **Priority:** `low` (informational deletion)

### **GET /api/leads/[leadId]** (READ)
- ✅ Authentication & Authorization
- ✅ Branch Scope Resolution
- ❌ No audit logging (read operations don't need)
- ❌ No notifications (read operations don't need)

---

## 📋 Notification Details

### **UPDATE Notification:**
```typescript
{
  userId: admin.id,
  type: "lead_assigned",
  title: "Lead Updated",
  message: `Lead "${leadName}" was updated by ${userName}`,
  priority: "low",
  status: "unread",
  read: false,
  data: { leadId, updatedBy: userName },
  branchId: branchId,
}
```

### **DELETE Notification:**
```typescript
{
  userId: admin.id,
  type: "system_announcement",
  title: "Lead Deleted",
  message: `Lead "${leadName}" was deleted by ${userName}`,
  priority: "low",
  status: "unread",
  read: false,
  data: { leadId, deletedBy: userName, leadName },
  branchId: branchId,
}
```

---

## 🎯 Apply This Pattern to ALL Resources

### **Routes Requiring Update:**

#### **Members Routes:**
- ✅ POST /api/members (has notifications)
- ⚠️ PUT /api/members/[id] - **NEEDS NOTIFICATION**
- ⚠️ DELETE /api/members/[id] - **NEEDS NOTIFICATION**

#### **Staff Routes:**
- ✅ POST /api/staff (has notifications)
- ⚠️ PUT /api/staff/[id] - **NEEDS NOTIFICATION**
- ⚠️ DELETE /api/staff/[id] - **NEEDS NOTIFICATION**

#### **Device Routes:**
- ✅ POST /api/devices (has notifications)
- ⚠️ PUT /api/devices/[id] - **NEEDS NOTIFICATION**
- ⚠️ DELETE /api/devices/[id] - **NEEDS NOTIFICATION**

#### **Class Routes:**
- ✅ POST /api/classes (has notifications)
- ⚠️ PUT /api/classes/[id] - **NEEDS NOTIFICATION**
- ⚠️ DELETE /api/classes/[id] - **NEEDS NOTIFICATION**

#### **Branch Routes:**
- ✅ POST /api/branches (has notifications)
- ⚠️ PUT /api/branches/[id] - **NEEDS NOTIFICATION**
- ⚠️ DELETE /api/branches/[id] - **NEEDS NOTIFICATION**

#### **Plan Routes:**
- ✅ POST /api/plans (has notifications)
- ⚠️ PUT /api/plans/[id] - **NEEDS NOTIFICATION**
- ⚠️ DELETE /api/plans/[id] - **NEEDS NOTIFICATION**

#### **Expense Routes:**
- ✅ POST /api/expenses (has audit logging)
- ⚠️ PUT /api/expenses/[id] - **NEEDS AUDIT + NOTIFICATION**
- ⚠️ DELETE /api/expenses/[id] - **NEEDS AUDIT + NOTIFICATION**

#### **Communication Routes:**
- ✅ POST /api/communications (has audit logging)
- ⚠️ PUT /api/communications/[id] - **NEEDS AUDIT + NOTIFICATION**
- ⚠️ DELETE /api/communications/[id] - **NEEDS AUDIT + NOTIFICATION**

---

## 📝 Template for UPDATE Operation

```typescript
// PUT /api/[resource]/[resourceId] - Update a resource
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { resourceId } = await params;

    // 1. Authentication
    const auth = await requireSession(["super_admin", "branch_admin"]);
    if ("response" in auth) return auth.response;

    // 2. Parse body
    const body = await parseBody<Partial<Resource>>(request);
    if (!body) {
      return errorResponse("Invalid request body");
    }

    // 3. Get existing resource
    const existing = await resourceService.getResource(resourceId);
    if (!existing.success || !existing.data) {
      return errorResponse(existing.error || "Resource not found", 404);
    }

    // 4. Branch scope
    const requestedBranchId = body.branchId ?? existing.data.branchId;
    const scoped = resolveBranchScope(auth.session, requestedBranchId);
    if ("response" in scoped) return scoped.response;

    // 5. Update resource
    const result = await resourceService.updateResource(resourceId, {
      ...body,
      branchId: scoped.branchId ?? body.branchId,
    });

    if (!result.success || !result.data) {
      return errorResponse(result.error || "Resource not found", 404);
    }

    // 6. Get actor info
    const actor = await getRequestUser();
    const ipAddress = getRequestIp(request);

    // 7. Audit log
    auditService.logAction({
      userId: actor.userId,
      userName: actor.userName,
      action: "update_resource",
      resource: "resource_type",
      resourceId: resourceId,
      details: body as Record<string, unknown>,
      ipAddress,
      branchId: result.data.branchId,
    });

    // 8. Notifications
    if (result.data.branchId) {
      try {
        const { userRepository, notificationRepository } = await import("@/modules/database");
        const branchAdmins = await userRepository.findByBranchAsync(result.data.branchId);
        const adminUsers = branchAdmins.filter(u => u.role === "branch_admin");

        for (const admin of adminUsers) {
          await notificationRepository.createAsync({
            userId: admin.id,
            type: "system_announcement" as const,
            title: "Resource Updated",
            message: `${resourceType} "${result.data.name}" was updated by ${actor.userName}`,
            priority: "low" as const,
            status: "unread" as const,
            read: false,
            data: { resourceId: resourceId, updatedBy: actor.userName },
            branchId: result.data.branchId,
          });
        }
      } catch (notifError) {
        console.error("[Resource Update] Failed to create notifications:", notifError);
      }
    }

    return successResponse(result.data, "Resource updated successfully");

  } catch (error) {
    console.error("Update resource error:", error);
    return errorResponse("Failed to update resource", 500);
  }
}
```

---

## 📝 Template for DELETE Operation

```typescript
// DELETE /api/[resource]/[resourceId] - Delete a resource
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { resourceId } = await params;

    // 1. Authentication
    const auth = await requireSession(["super_admin", "branch_admin"]);
    if ("response" in auth) return auth.response;

    // 2. Get existing resource
    const existing = await resourceService.getResource(resourceId);
    if (!existing.success || !existing.data) {
      return errorResponse(existing.error || "Resource not found", 404);
    }

    // 3. Branch scope
    const scoped = resolveBranchScope(auth.session, existing.data.branchId);
    if ("response" in scoped) return scoped.response;

    // 4. Delete resource
    const result = await resourceService.deleteResource(resourceId);

    if (!result.success) {
      return errorResponse(result.error || "Resource not found", 404);
    }

    // 5. Get actor info
    const actor = await getRequestUser();
    const ipAddress = getRequestIp(request);

    // 6. Audit log
    auditService.logAction({
      userId: actor.userId,
      userName: actor.userName,
      action: "delete_resource",
      resource: "resource_type",
      resourceId: resourceId,
      details: { name: existing.data.name },
      ipAddress,
      branchId: existing.data.branchId,
    });

    // 7. Notifications
    if (existing.data.branchId) {
      try {
        const { userRepository, notificationRepository } = await import("@/modules/database");
        const branchAdmins = await userRepository.findByBranchAsync(existing.data.branchId);
        const adminUsers = branchAdmins.filter(u => u.role === "branch_admin");

        for (const admin of adminUsers) {
          await notificationRepository.createAsync({
            userId: admin.id,
            type: "system_announcement" as const,
            title: "Resource Deleted",
            message: `${resourceType} "${existing.data.name}" was deleted by ${actor.userName}`,
            priority: "low" as const,
            status: "unread" as const,
            read: false,
            data: { 
              resourceId: resourceId, 
              deletedBy: actor.userName, 
              resourceName: existing.data.name 
            },
            branchId: existing.data.branchId,
          });
        }
      } catch (notifError) {
        console.error("[Resource Delete] Failed to create notifications:", notifError);
      }
    }

    return successResponse(result.data, "Resource deleted successfully");

  } catch (error) {
    console.error("Delete resource error:", error);
    return errorResponse("Failed to delete resource", 500);
  }
}
```

---

## 🎨 Notification Priority Guidelines

### **CREATE Operations:**
- **Priority:** `medium` or `high`
- **Rationale:** New resources often require action or review

### **UPDATE Operations:**
- **Priority:** `low`
- **Rationale:** Updates are usually informational, not urgent

### **DELETE Operations:**
- **Priority:** `low` or `medium`
- **Rationale:** Deletions are informational but may warrant attention
- **Use `medium` for:** Critical resources (members, staff, branches)
- **Use `low` for:** Less critical resources (leads, communications)

---

## ✅ Implementation Checklist

For each resource, verify:

### **POST (CREATE):**
- [ ] Authentication
- [ ] Branch scope
- [ ] Audit log with branchId
- [ ] Notification with branchId
- [ ] Priority: medium/high

### **PUT (UPDATE):**
- [ ] Authentication
- [ ] Branch scope
- [ ] Audit log with branchId
- [ ] Notification with branchId ← **CRITICAL**
- [ ] Priority: low

### **DELETE:**
- [ ] Authentication
- [ ] Branch scope
- [ ] Audit log with branchId
- [ ] Notification with branchId ← **CRITICAL**
- [ ] Priority: low/medium

### **GET (READ):**
- [ ] Authentication
- [ ] Branch scope
- [ ] No audit log needed
- [ ] No notification needed

---

## 🚀 Next Steps

1. **Review all `[resourceId]/route.ts` files**
2. **Add notifications to UPDATE operations**
3. **Add notifications to DELETE operations**
4. **Test each route**
5. **Update documentation**

---

## 📊 Progress Tracker

| Resource | CREATE | UPDATE | DELETE | Status |
|----------|--------|--------|--------|--------|
| Leads | ✅ | ✅ | ✅ | **COMPLETE** |
| Members | ✅ | ⚠️ | ⚠️ | Partial |
| Staff | ✅ | ⚠️ | ⚠️ | Partial |
| Devices | ✅ | ⚠️ | ⚠️ | Partial |
| Classes | ✅ | ⚠️ | ⚠️ | Partial |
| Branches | ✅ | ⚠️ | ⚠️ | Partial |
| Plans | ✅ | ⚠️ | ⚠️ | Partial |
| Expenses | ✅ | ❌ | ❌ | Needs work |
| Communications | ✅ | ❌ | ❌ | Needs work |

**Legend:**
- ✅ = Complete (has audit + notification)
- ⚠️ = Has audit, missing notification
- ❌ = Missing both audit and notification

---

**Last Updated:** 2025-12-24 16:58 IST
**Status:** ✅ TEMPLATE READY FOR ALL ROUTES
