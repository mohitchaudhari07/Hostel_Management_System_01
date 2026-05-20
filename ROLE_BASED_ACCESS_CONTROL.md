# Role-Based Access Control Implementation

## Overview

This implementation adds strict role-based access control to ensure:

- ✅ Students cannot access admin dashboards
- ✅ Admins cannot access student dashboards
- ✅ Unauthenticated users are redirected to login
- ✅ Clear logout functionality with user info display

## Files Created/Modified

### 1. **ProtectedRoute Component**

**File:** `frontend/src/components/ProtectedRoute.jsx`

Protects all dashboard routes by:

- Checking if user is logged in (localStorage)
- Validating user's role matches required roles for the route
- Redirecting unauthorized users to their appropriate dashboard
- Clearing invalid session data

**Usage:**

```jsx
<Route path="/admin" element={<ProtectedRoute element={<AdminDashboard />} requiredRoles={["admin"]} />} />
<Route path="/student" element={<ProtectedRoute element={<StudentDashboard />} requiredRoles={["student", "mess", "mess_staff"]} />} />
```

### 2. **Auth Utilities**

**File:** `frontend/src/utils/authUtils.js`

Helper functions:

- `logoutUser()` - Clears session and redirects to login
- `getCurrentUser()` - Gets logged-in user from localStorage
- `isAdmin()` - Checks if current user is admin
- `isStudent()` - Checks if current user is student/mess/mess_staff
- `isLoggedIn()` - Checks if user is authenticated

**Usage:**

```jsx
import { logoutUser, getCurrentUser, isAdmin } from "../utils/authUtils";

const user = getCurrentUser();
if (isAdmin()) {
  /* admin logic */
}
logoutUser(); // logout
```

### 3. **DashboardHeader Component**

**File:** `frontend/src/components/DashboardHeader.jsx`

Displays:

- Dashboard title
- Current user name and role
- Logout button with confirmation

**Usage in Dashboard Pages:**

```jsx
import DashboardHeader from "../components/DashboardHeader";

export default function AdminDashboard() {
  return (
    <>
      <DashboardHeader title="Admin Dashboard" />
      {/* Rest of dashboard content */}
    </>
  );
}
```

### 4. **Updated App.jsx**

**File:** `frontend/src/App.jsx`

Routes now wrapped with ProtectedRoute:

- **Admin Routes**: Require `["admin"]` role
- **Student Routes**: Require `["student", "mess", "mess_staff"]` roles
- **Public Routes**: /login, /register, /enquiry (no protection)

## Access Control Matrix

| Route                    | Required Roles            | Admin | Student | Mess Staff |
| ------------------------ | ------------------------- | ----- | ------- | ---------- |
| `/admin`                 | admin                     | ✅    | ❌      | ❌         |
| `/admin/enquiries`       | admin                     | ✅    | ❌      | ❌         |
| `/admin/mess-management` | admin                     | ✅    | ❌      | ❌         |
| `/student`               | student, mess, mess_staff | ❌    | ✅      | ✅         |
| `/mess`                  | student, mess, mess_staff | ❌    | ✅      | ✅         |
| `/mess/menu`             | student, mess, mess_staff | ❌    | ✅      | ✅         |
| `/mess-staff`            | student, mess, mess_staff | ❌    | ✅      | ✅         |

## Backend Authentication (authController.js)

Updated `loginUser` function validates:

- `loginType` parameter (admin or student)
- User role matches selected login type
- Returns 403 Forbidden if there's a mismatch

```javascript
if (loginType === "admin" && user.role !== "admin") {
  return res
    .status(403)
    .json({ message: "Access denied. Admin credentials required." });
}

if (
  loginType === "student" &&
  !["student", "mess", "mess_staff"].includes(user.role)
) {
  return res
    .status(403)
    .json({ message: "Access denied. Student credentials required." });
}
```

## User Flow Examples

### Scenario 1: Student Tries to Access Admin Dashboard

1. Student logs in with "Student" selected
2. Attempts to navigate to `/admin` manually
3. ProtectedRoute checks: user.role = "student", requiredRoles = ["admin"]
4. ❌ Access denied → Redirected to `/student`

### Scenario 2: Admin Tries to Access Student Dashboard

1. Admin logs in with "Admin" selected
2. Attempts to navigate to `/student` manually
3. ProtectedRoute checks: user.role = "admin", requiredRoles = ["student", "mess", "mess_staff"]
4. ❌ Access denied → Redirected to `/admin`

### Scenario 3: Unauthorized User Tries to Access Protected Route

1. User (not logged in) tries to access `/admin`
2. ProtectedRoute finds no localStorage user data
3. ❌ Not authenticated → Redirected to `/login`

## Integration Checklist

- [ ] Add `<DashboardHeader title="Admin Dashboard" />` to AdminDashboard.jsx
- [ ] Add `<DashboardHeader title="Student Dashboard" />` to StudentDashboard.jsx
- [ ] Add `<DashboardHeader title="Mess Dashboard" />` to MessDashboard.jsx
- [ ] Add `<DashboardHeader title="Mess Staff Dashboard" />` to MessStaffDashboard.jsx
- [ ] Add `<DashboardHeader title="Mess Analytics" />` to MessAnalytics.jsx (if exists)
- [ ] Add `<DashboardHeader title="Admin Enquiries" />` to AdminEnquiries.jsx
- [ ] Test all redirect scenarios
- [ ] Verify logout functionality

## Security Features

✅ **Automatic Session Validation**

- User data validated on every protected route access
- Invalid JSON data detected and cleared

✅ **Role-Based Authorization**

- Each route enforces specific roles
- No single route allows cross-role access

✅ **Logout Mechanism**

- Clears localStorage user data
- Redirects to login page
- Confirmation before logout prevents accidents

✅ **Graceful Error Handling**

- Try-catch in ProtectedRoute catches parsing errors
- Users with corrupted data automatically logged out

## Testing Commands

```bash
# In browser console - simulate different users:

// Admin user
localStorage.setItem('user', JSON.stringify({id: 1, name: 'Admin', email: 'admin@test.com', role: 'admin'}))

// Student user
localStorage.setItem('user', JSON.stringify({id: 2, name: 'Student', email: 'student@test.com', role: 'student'}))

// Clear session
localStorage.removeItem('user')

// Check current user
JSON.parse(localStorage.getItem('user'))
```
