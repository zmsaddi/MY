# Login Credentials for Metal Sheets Management System

## 🔐 Default Admin Account

**Username:** `admin`

**Password:** The password is now **randomly generated** for security reasons.

### How to Find Your Password:

When you first run the application, the generated password will be displayed in the browser console.

1. **Open the Application** in your browser (http://localhost:5173)
2. **Open Browser Console** (Press F12 or right-click → Inspect → Console)
3. **Look for the login credentials box** that appears like this:

```
╔════════════════════════════════════════════════╗
║         DEFAULT ADMIN CREDENTIALS              ║
╠════════════════════════════════════════════════╣
║  Username: admin                               ║
║  Password: [RANDOM_GENERATED_PASSWORD]         ║
║                                                ║
║  ⚠️  IMPORTANT: Change this password on        ║
║     first login for security!                 ║
╚════════════════════════════════════════════════╝
```

### Security Notes:

- The password is randomly generated using cryptographically secure methods
- It's different for each new database initialization
- The password follows this pattern:
  - Browser environment: 16 character hex string (e.g., `a3f5b2c8d9e1f4a7`)
  - Fallback: `Admin@` + timestamp + random string (e.g., `Admin@ln5k8x2m3p9q`)

### If You Can't Find the Password:

If the database already exists and you don't know the password, you can:

1. **Reset the database** (this will delete all data):
   - Delete the browser's localStorage for the application
   - Refresh the page to regenerate a new database with new credentials

2. **Check the console** when starting the application fresh

### Password Requirements (After Login):

Once logged in, any new passwords must meet these requirements:
- Minimum 8 characters
- At least one uppercase letter (A-Z)
- At least one lowercase letter (a-z)
- At least one number (0-9)
- At least one special character (!@#$%^&*...)
- Password strength score ≥ 60/100

### Important Security Reminder:

⚠️ **Change the default password immediately after first login!**

The system will prompt you to change the password if:
- You're using the default generated password
- The password is weak (score < 60/100)
- The password hasn't been changed in 90 days

---

**Note:** This enhanced security was implemented as part of the comprehensive security audit to protect against unauthorized access.