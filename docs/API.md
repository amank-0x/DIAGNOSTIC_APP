# API Documentation

## Base URL

- Development: `http://localhost:3000`
- Production: `https://your-domain.com`

## Authentication

The API uses server-side session tokens for authentication. Session tokens are:
- Sent in `X-Session-Token` header
- Or as Bearer token in `Authorization` header
- Or stored in `bl_session_token` HttpOnly cookie

### Headers

```typescript
{
  'X-Session-Token': 'your-session-token',
  // or
  'Authorization': 'Bearer your-session-token'
}
```

## Response Format

All API responses follow this format:

### Success Response
```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message describing what went wrong"
}
```

## Rate Limiting

All API endpoints are rate-limited:
- Default: 120 requests per 60 seconds per IP
- Configurable via `RATE_LIMIT_WINDOW_MS` and `RATE_LIMIT_MAX_REQUESTS`
- Rate limit exceeded returns HTTP 429 with `Retry-After` header

---

## Health Check

### GET /api/health

Check server health and system status.

**Response:**
```json
{
  "status": "healthy",
  "service": "B.L. Diagnostic Center Production Server",
  "environment": "development",
  "timestamp": "2026-10-01T11:39:52.904Z",
  "uptimeSeconds": 41,
  "authentication": "MOBILE_OTP_SERVER_VERIFIED",
  "database": {
    "primarySourceOfTruth": "PostgreSQL / Firestore",
    "operationalSyncLayer": "Google Sheets v4"
  },
  "googleSheets": {
    "spreadsheetTitle": "B.L. Diagnostic Center - Website Database",
    "mode": "CREDENTIALS_REQUIRED",
    "configured": false
  }
}
```

---

## Authentication Endpoints

### POST /api/auth/send-otp

Request a 6-digit OTP to be sent to an Indian mobile number.

**Request Body:**
```json
{
  "mobile_number": "+919649183422"
}
```

**Valid Formats:**
- `+919649183422` (with country code)
- `9649183422` (10-digit, assumes +91)
- `9649183422` (with spaces/hyphens will be normalized)

**Response:**
```json
{
  "success": true,
  "mobile_number": "+919649183422",
  "isExistingUser": false,
  "expiresInSeconds": 300,
  "resendCooldownSeconds": 30,
  "liveSmsDispatched": true,
  "sandboxOtp": "123456",
  "message": "OTP sent successfully"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Please enter a valid 10-digit Indian mobile number."
}
```

**Notes:**
- OTP is generated server-side and hashed before storage
- OTP expires in 5 minutes (configurable via `OTP_EXPIRY_SECONDS`)
- Resend cooldown: 30 seconds (configurable via `OTP_RESEND_COOLDOWN_SECONDS`)
- In development, OTP is returned in `sandboxOtp` field

---

### POST /api/auth/resend-otp

Resend OTP after cooldown period.

**Request Body:**
```json
{
  "mobile_number": "+919649183422"
}
```

**Response:** Same as `/api/auth/send-otp`

**Error Response:**
```json
{
  "success": false,
  "error": "Please wait before requesting another OTP."
}
```

---

### POST /api/auth/verify-otp

Verify OTP and create user session.

**Request Body:**
```json
{
  "mobile_number": "+919649183422",
  "otp": "123456",
  "name": "John Doe"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user-uuid",
    "userId": "USER-ABC123",
    "mobile_number": "+919649183422",
    "name": "John Doe",
    "email": "",
    "role": "USER",
    "is_active": true,
    "created_at": "2026-10-01T11:00:00.000Z",
    "last_login_at": "2026-10-01T11:39:00.000Z"
  },
  "isNewUser": true,
  "sessionToken": "session-token-string",
  "expiresAt": 1696166400000
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Invalid or expired OTP. Please try again."
}
```

**Notes:**
- Creates new user if mobile number not found
- Updates existing user if mobile number already registered
- `name` is required for new users
- Session token is set in HttpOnly cookie
- Non-blocking sync to Google Sheets Users tab

---

### GET /api/auth/session

Get current authenticated user from session.

**Headers:**
```typescript
{
  'X-Session-Token': 'your-session-token'
}
```

**Response:**
```json
{
  "authenticated": true,
  "user": {
    "id": "user-uuid",
    "userId": "USER-ABC123",
    "mobile_number": "+919649183422",
    "name": "John Doe",
    "role": "USER",
    "is_active": true
  }
}
```

**Not Authenticated:**
```json
{
  "authenticated": false,
  "user": null
}
```

---

### PUT /api/auth/profile

Update user profile (name, role, status).

**Headers:**
```typescript
{
  'X-Session-Token': 'your-session-token'
}
```

**Request Body:**
```json
{
  "userId": "USER-ABC123",
  "name": "John Updated Doe",
  "role": "ADMIN",
  "is_active": true
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user-uuid",
    "userId": "USER-ABC123",
    "name": "John Updated Doe",
    "role": "ADMIN",
    "is_active": true
  }
}
```

**Notes:**
- Only ADMIN users can update `role` and `is_active`
- Regular users can only update their own `name`

---

### POST /api/auth/logout

End user session and clear cookie.

**Headers:**
```typescript
{
  'X-Session-Token': 'your-session-token'
}
```

**Response:**
```json
{
  "success": true
}
```

---

## Google Sheets Endpoints

### GET /api/sheets/status

Get Google Sheets connection status and configuration.

**Response:**
```json
{
  "configured": false,
  "authMode": "NONE",
  "spreadsheetTitle": "B.L. Diagnostic Center - Website Database",
  "spreadsheetId": "",
  "spreadsheetUrl": "",
  "connectionStatus": "CREDENTIALS_REQUIRED",
  "mode": "CREDENTIALS_REQUIRED",
  "spreadsheetIdConfigured": false,
  "serviceAccountConfigured": false,
  "oauthConnected": false,
  "serviceAccountEmailMasked": "",
  "connectedAccountEmailMasked": "",
  "spreadsheetIdMasked": "",
  "reason": "Configure GOOGLE_SHEETS_SPREADSHEET_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL, and GOOGLE_PRIVATE_KEY in .env, or connect via Google Sheets in Admin.",
  "worksheetsCount": 9,
  "canonicalTabs": [
    "Users",
    "Patients",
    "Bookings",
    "Home Collection",
    "Leads",
    "Tests",
    "Packages",
    "Time Slots",
    "Sync Logs"
  ],
  "worksheets": [
    {
      "name": "Users",
      "headers": ["User ID", "Customer Name", "Mobile Number", ...]
    },
    ...
  ],
  "metrics": {
    "totalSyncs": 100,
    "successfulSyncs": 95,
    "failedSyncs": 5,
    "successRate": 0.95
  },
  "recentServerLogs": [...]
}
```

---

### POST /api/sheets/set-spreadsheet

Configure Google Sheets spreadsheet connection.

**Headers:**
```typescript
{
  'Authorization': 'Bearer oauth-token'
}
```

**Request Body:**
```json
{
  "urlOrId": "https://docs.google.com/spreadsheets/d/1ABC123xyz/edit"
}
```

**OR**
```json
{
  "spreadsheetId": "1ABC123xyz"
}
```

**Response:**
```json
{
  "success": true,
  "spreadsheetId": "1ABC123xyz",
  "spreadsheetIdMasked": "1ABC****xyz",
  "spreadsheetUrl": "https://docs.google.com/spreadsheets/d/1ABC123xyz",
  "ensuredTabs": [
    "Users",
    "Patients",
    "Bookings",
    "Home Collection",
    "Leads",
    "Tests",
    "Packages",
    "Time Slots",
    "Sync Logs"
  ],
  "connectionStatus": "CONNECTED"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Please provide a valid Google Spreadsheet URL or Spreadsheet ID."
}
```

---

### POST /api/sheets/initial-sync

Perform initial backfill of data to Google Sheets.

**Headers:**
```typescript
{
  'Authorization': 'Bearer oauth-token'
}
```

**Request Body (Optional):**
```json
{
  "users": [...],
  "patients": [...],
  "bookings": [...],
  "leads": [...]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Initial backfill completed successfully without duplicate rows.",
  "synced": {
    "tests": 50,
    "packages": 10,
    "timeSlots": 8,
    "users": 0,
    "patients": 0,
    "bookings": 0,
    "leads": 0
  }
}
```

**Notes:**
- Always syncs initial tests and packages from seed data
- Syncs standard operating time slots
- Optionally syncs provided users, patients, bookings, leads
- Prevents duplicate rows via lookup

---

### POST /api/sheets/sync-patient

Sync a single patient to Google Sheets.

**Headers:**
```typescript
{
  'Authorization': 'Bearer oauth-token'
}
```

**Request Body:**
```json
{
  "patient": {
    "id": "patient-uuid",
    "user_id": "user-uuid",
    "patient_name": "John Doe",
    "relationship": "Self",
    "gender": "Male",
    "dob_or_age": "35 Yrs",
    "mobile_number": "+919649183422",
    "address": "123 Main St",
    "status": "ACTIVE"
  }
}
```

**Response:**
```json
{
  "success": true,
  "syncedCount": 1,
  "sheetRowId": 10
}
```

---

### POST /api/sheets/sync-lead

Sync a single lead to Google Sheets.

**Headers:**
```typescript
{
  'Authorization': 'Bearer oauth-token'
}
```

**Request Body:**
```json
{
  "lead": {
    "id": "lead-uuid",
    "name": "Jane Doe",
    "phone": "+919876543210",
    "email": "jane@example.com",
    "source": "Website",
    "lead_type": "General Enquiry",
    "message": "I want to book a test",
    "status": "NEW"
  }
}
```

**Response:**
```json
{
  "success": true,
  "syncedCount": 1,
  "sheetRowId": 5
}
```

---

### POST /api/sheets/connect-oauth

Connect to Google Sheets using OAuth token.

**Headers:**
```typescript
{
  'Authorization': 'Bearer oauth-token'
}
```

**Request Body:**
```json
{
  "accessToken": "ya29.a0AfH6...",
  "spreadsheetId": "1ABC123xyz",
  "email": "user@gmail.com"
}
```

**Response:**
```json
{
  "success": true,
  "spreadsheetTitle": "B.L. Diagnostic Center - Website Database",
  "spreadsheetIdMasked": "1ABC****xyz",
  "ensuredTabs": [
    "Users",
    "Patients",
    "Bookings",
    "Home Collection",
    "Leads",
    "Tests",
    "Packages",
    "Time Slots",
    "Sync Logs"
  ],
  "connectionStatus": "CONNECTED"
}
```

---

### POST /api/sheets/ensure-tabs

Ensure all required worksheet tabs exist in the spreadsheet.

**Headers:**
```typescript
{
  'Authorization': 'Bearer oauth-token'
}
```

**Response:**
```json
{
  "success": true,
  "ensuredTabs": [
    "Users",
    "Patients",
    "Bookings",
    "Home Collection",
    "Leads",
    "Tests",
    "Packages",
    "Time Slots",
    "Sync Logs"
  ]
}
```

---

### POST /api/sheets/sync-user

Sync a single user to Google Sheets.

**Headers:**
```typescript
{
  'Authorization': 'Bearer oauth-token'
}
```

**Request Body:**
```json
{
  "user": {
    "userId": "USER-ABC123",
    "firebaseUid": "user-uuid",
    "fullName": "John Doe",
    "email": "john@example.com",
    "phone": "+919649183422",
    "role": "USER",
    "accountStatus": "ACTIVE",
    "registrationDate": "2026-10-01T11:00:00.000Z",
    "lastLogin": "2026-10-01T11:39:00.000Z"
  }
}
```

**Response:**
```json
{
  "success": true,
  "syncedCount": 1,
  "sheetRowId": 15
}
```

---

### POST /api/sheets/sync-booking

Sync a single booking to Google Sheets.

**Headers:**
```typescript
{
  'Authorization': 'Bearer oauth-token'
}
```

**Request Body:**
```json
{
  "booking": {
    "id": "BLD-2026-9481",
    "booking_date": "2026-10-01",
    "booking_time": "07:30 AM",
    "customer_name": "John Doe",
    "mobile_number": "+919649183422",
    "patient_name": "John Doe",
    "relationship": "Self",
    "test_package": "CBC",
    "test_id": "BLD-T001",
    "collection_type": "CENTER_VISIT",
    "appointment_date": "2026-10-02",
    "time_slot": "07:00 AM - 08:00 AM",
    "test_charges": 500,
    "home_collection_fee": 0,
    "total_amount": 500,
    "payment_method": "PAY_AT_CENTER",
    "status": "CONFIRMED"
  }
}
```

**Response:**
```json
{
  "success": true,
  "syncedCount": 1,
  "sheetRowId": 20
}
```

---

### POST /api/sheets/sync

Generic sync endpoint for any entity type.

**Headers:**
```typescript
{
  'Authorization': 'Bearer oauth-token'
}
```

**Request Body:**
```json
{
  "syncId": "sync-uuid",
  "entityType": "Bookings",
  "entityId": "BLD-2026-9481",
  "operation": "CREATE",
  "records": [
    {
      "id": "BLD-2026-9481",
      "customer_name": "John Doe",
      ...
    }
  ],
  "previousAttemptCount": 0
}
```

**Valid Entity Types:**
- `Users`
- `Patients`
- `Bookings`
- `Home Collection`
- `Leads`
- `Tests`
- `Packages`
- `Time Slots`
- `Sync Logs`

**Valid Operations:**
- `CREATE`
- `UPDATE`
- `DELETE`

**Response:**
```json
{
  "success": true,
  "liveApiCalled": true,
  "syncedCount": 1,
  "syncLog": {
    "sync_id": "sync-uuid",
    "entity_type": "Bookings",
    "entity_id": "BLD-2026-9481",
    "operation": "CREATE",
    "status": "SUCCESS",
    "attempt_count": 1,
    "error_message": "",
    "last_attempt": "2026-10-01T11:40:00.000Z",
    "synced_at": "2026-10-01T11:40:00.000Z"
  },
  "mappedPreview": [
    ["BLD-2026-9481", "2026-10-01", "07:30 AM", ...]
  ]
}
```

---

### POST /api/sheets/retry

Retry failed Google Sheets sync operations.

**Headers:**
```typescript
{
  'Authorization': 'Bearer oauth-token'
}
```

**Request Body:**
```json
{
  "items": [
    {
      "sync_id": "sync-uuid-1",
      "entity_type": "Bookings",
      "entity_id": "BLD-2026-9481",
      "operation": "CREATE",
      "attempt_count": 2
    },
    {
      "sync_id": "sync-uuid-2",
      "entity_type": "Users",
      "entity_id": "USER-ABC123",
      "operation": "UPDATE",
      "attempt_count": 1
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "total": 2,
  "retried": 2,
  "succeeded": 1,
  "failed": 1,
  "results": [
    {
      "sync_id": "sync-uuid-1",
      "status": "SUCCESS"
    },
    {
      "sync_id": "sync-uuid-2",
      "status": "FAILED",
      "error": "Permission denied"
    }
  ]
}
```

---

### POST /api/sheets/import-validate

Validate rows for import from Google Sheets.

**Headers:**
```typescript
{
  'Authorization': 'Bearer oauth-token'
}
```

**Request Body:**
```json
{
  "tab": "Tests",
  "rows": [
    {
      "test_id": "BLD-T001",
      "test_name": "Complete Blood Count",
      "category": "Hematology",
      ...
    }
  ]
}
```

**OR (fetch from sheet):**
```json
{
  "tab": "Tests"
}
```

**Response:**
```json
{
  "valid": true,
  "tab": "Tests",
  "rowCount": 50,
  "rows": [...]
}
```

**Error Response:**
```json
{
  "valid": false,
  "error": "Invalid worksheet tab \"InvalidTab\"."
}
```

---

## Error Codes

### HTTP Status Codes

- `200 OK` - Successful request
- `400 Bad Request` - Invalid request parameters
- `401 Unauthorized` - Missing or invalid authentication
- `403 Forbidden` - Insufficient permissions
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

### Error Response Format

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

### Common Error Codes

- `RATE_LIMIT_EXCEEDED` - Too many requests
- `INVALID_MOBILE_NUMBER` - Invalid mobile number format
- `OTP_EXPIRED` - OTP has expired
- `OTP_INVALID` - Invalid OTP
- `RESEND_COOLDOWN` - Must wait before resending OTP
- `MAX_ATTEMPTS_EXCEEDED` - Too many OTP attempts
- `ACCOUNT_DEACTIVATED` - User account is deactivated
- `CREDENTIALS_REQUIRED` - Google Sheets credentials not configured
- `INVALID_SPREADSHEET` - Invalid spreadsheet ID or URL
- `PERMISSION_DENIED` - Insufficient Google Sheets permissions
- `INVALID_ENTITY_TYPE` - Invalid entity type for sync

---

## Rate Limiting Details

### Default Configuration
- Window: 60 seconds
- Max Requests: 120 per IP
- OTP-specific limits apply separately

### Rate Limit Response
```json
{
  "error": "Too many requests. Please wait a moment before retrying.",
  "code": "RATE_LIMIT_EXCEEDED"
}
```

**Headers:**
```
Retry-After: 30
```

---

## Security Headers

All API responses include security headers:

```
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains (production only)
```

---

## Data Types

### User Object
```typescript
{
  id: string;                    // Firebase UID
  userId: string;                // Formatted user ID (USER-ABC123)
  mobile_number: string;        // +91XXXXXXXXXX
  name: string;                 // Full name
  email: string;                // Email (optional)
  role: 'USER' | 'STAFF' | 'ADMIN';
  is_active: boolean;
  is_verified: boolean;
  created_at: string;           // ISO 8601 timestamp
  updated_at: string;           // ISO 8601 timestamp
  last_login_at: string;        // ISO 8601 timestamp
}
```

### Booking Object
```typescript
{
  id: string;                    // BLD-2026-9481
  booking_date: string;         // YYYY-MM-DD
  booking_time: string;         // HH:MM AM/PM
  customer_name: string;
  mobile_number: string;
  patient_name: string;
  relationship: string;
  test_package: string;
  test_id: string;
  collection_type: 'CENTER_VISIT' | 'HOME_COLLECTION';
  appointment_date: string;
  time_slot: string;
  test_charges: number;
  home_collection_fee: number;
  total_amount: number;
  payment_method: string;
  status: string;
  created_at: string;
  updated_at: string;
}
```

### Patient Object
```typescript
{
  id: string;
  user_id: string;
  patient_name: string;
  relationship: string;
  gender: 'Male' | 'Female' | 'Other';
  dob_or_age: string;
  mobile_number: string;
  address: string;
  status: string;
  created_at: string;
  updated_at: string;
}
```

### Lead Object
```typescript
{
  id: string;
  name: string;
  phone: string;
  email: string;
  source: string;
  lead_type: string;
  message: string;
  status: string;
  created_at: string;
  updated_at: string;
}
```

---

## Webhooks

Currently, the system does not support webhooks. All data synchronization is handled via the Google Sheets sync layer.

---

## Versioning

The API is currently at version 1.0. Future versions will be indicated via URL path (e.g., `/api/v2/...`).

---

## Testing

### Testing OTP in Development

In development mode, the OTP is returned in the response:

```json
{
  "success": true,
  "sandboxOtp": "123456",
  ...
}
```

Use this OTP for testing without sending actual SMS.

### Testing Without Google Sheets

The system can operate without Google Sheets configured. Sync operations will fail gracefully and log errors.

---

## Support

For API support or issues:
- Email: bldiagnosticcentre@gmail.com
- Phone: +91 9649183422
