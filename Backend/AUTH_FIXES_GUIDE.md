# Authentication System - Fix Summary

## Issues Fixed

### 1. ✅ Student Registration - Now Auto-Creates User Account

**Problem:** Students submitted enquiries but no User account was created for login.
**Solution:** Modified `createEnquiry` to automatically create a User account with a temporary password and send credentials via email.

**Changes:**

- `enquiryController.js` - `createEnquiry` now:
  - Generates temporary password
  - Creates User account automatically
  - Sends credentials via email
  - Returns user ID and temp password

### 2. ✅ Improved Error Logging

**Changes:**

- `authController.js` - Added console logging to `loginUser` and `createUser` for debugging
- `server.js` - Added `/api/health` endpoint to check server status
- Better error messages in terminal output

### 3. ✅ Fixed Student Profile Retrieval

**Problem:** `getCurrentStudent` was looking in Student collection instead of User collection.
**Solution:** Modified to look in User collection and optionally include Student details if they exist.

---

## New Authentication Flow

### For Students:

```
1. Student submits enquiry form
   ↓
2. Backend auto-creates User account with temp password
   ↓
3. Email sent with login credentials
   ↓
4. Student can login immediately with temp password
   ↓
5. Student changes password on first login
   ↓
6. Admin later approves enquiry and creates Student record (for room/payment details)
```

### For Admins:

```
1. Admin registers at /admin/register with secret code
   ↓
2. Backend creates User account with role="admin"
   ↓
3. Admin can login and manage the system
```

---

## Required Environment Variables

Create a `.env` file in the `Backend/` directory with:

```env
# MongoDB
MONGO_URI=mongodb://localhost:27017/smart_hostel

# JWT Secret (change this in production!)
JWT_SECRET=your-secret-key-here-change-in-production

# Email Configuration (for sending credentials)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password-here

# Port
PORT=5000
```

### How to get Gmail App Password:

1. Enable 2-Factor Authentication on your Google Account
2. Go to myaccount.google.com/apppasswords
3. Select Mail and Windows Computer
4. Copy the 16-character password
5. Paste in `.env` as `EMAIL_PASS`

---

## API Endpoints

### Public Endpoints

- `POST /api/auth/login` - Login (student or admin)

  ```json
  {
    "email": "user@example.com",
    "password": "password123",
    "loginType": "student" // or "admin"
  }
  ```

- `POST /api/enquiries` - Submit student enquiry (auto-creates user)

  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "9876543210",
    "course": "B.Tech",
    "preferredRoomType": "Double"
  }
  ```

- `POST /api/auth/create-user` - Admin registration (first user) or user creation (by admin)
  ```json
  {
    "name": "Admin Name",
    "email": "admin@example.com",
    "password": "securepassword",
    "role": "admin" // or "student", "mess", "mess_staff"
  }
  ```

### Protected Endpoints (require token)

- `GET /api/auth/student-profile` - Get current student profile
  - Header: `Authorization: Bearer <token>`

- `GET /api/auth/users` - Get all users (admin only)
  - Header: `Authorization: Bearer <token>`

- `GET /api/auth/students` - Get all students (admin/mess/mess_staff)
  - Header: `Authorization: Bearer <token>`

---

## Testing

### Option 1: Use the Test Script

```bash
cd Backend
npm install  # if not already done
node test-auth-flow.js
```

This will:

1. Check server health
2. Create a test admin
3. Test admin login
4. Submit a test student enquiry
5. Test student login
6. Verify profile retrieval

### Option 2: Manual Testing

1. **Start the server:**

   ```bash
   cd Backend
   npm start
   ```

2. **Create first admin** (no authentication needed):

   ```bash
   curl -X POST http://localhost:5000/api/auth/create-user \
     -H "Content-Type: application/json" \
     -d '{
       "name": "Admin User",
       "email": "admin@example.com",
       "password": "AdminPass123",
       "role": "admin"
     }'
   ```

3. **Submit student enquiry:**

   ```bash
   curl -X POST http://localhost:5000/api/enquiries \
     -H "Content-Type: application/json" \
     -d '{
       "name": "John Student",
       "email": "john@example.com",
       "phone": "9876543210",
       "course": "B.Tech",
       "preferredRoomType": "Double"
     }'
   ```

4. **Login as student:**
   ```bash
   curl -X POST http://localhost:5000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{
       "email": "john@example.com",
       "password": "TEMP_PASSWORD_FROM_EMAIL",
       "loginType": "student"
     }'
   ```

---

## Troubleshooting

### "Invalid email" error

- ✅ Student enquiry wasn't processed properly
- Check: MongoDB connection, enquiry endpoint response

### "Invalid password" error

- ✅ User exists but password is wrong
- Check: Password is correct and case-sensitive

### Email not received

- ✅ Email credentials not configured
- Action: Set `EMAIL_USER` and `EMAIL_PASS` in `.env`
- If using Gmail, use an App Password (not regular password)

### Server won't start

- ✅ Port already in use or MongoDB not running
- Action: Check `PORT` in `.env`, start MongoDB service

### User can login but profile is empty

- ✅ This is normal for newly registered students
- The Student record is created later when admin approves the enquiry

---

## Next Steps

1. ✅ Deploy `.env` file with proper email credentials
2. ✅ Test the full flow (enquiry → login → profile)
3. ✅ Create admin UI to manage enquiries and convert them to students
4. ✅ Set up proper password reset flow
5. ✅ Add email verification (optional)

---

## Files Modified

- `Backend/controllers/authController.js` - Enhanced logging, fixed getCurrentStudent
- `Backend/controllers/enquiryController.js` - Auto-create User on enquiry
- `Backend/middleware/auth.js` - No changes (working correctly)
- `Backend/server.js` - Added health check endpoint
- `Backend/test-auth-flow.js` - New test script

---

## Support

If you encounter issues:

1. Check server logs for error messages (look for `[LOGIN FAILED]`, `[CREATE USER ERROR]`, etc.)
2. Verify `.env` file exists and has correct values
3. Run `node test-auth-flow.js` to diagnose
4. Check MongoDB is running: `mongosh` or MongoDB Compass
