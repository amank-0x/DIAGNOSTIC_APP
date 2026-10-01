# Firebase Authentication + Google Sheets Setup Guide

This guide explains how to set up Firebase Authentication (email/password) with Google Sheets registration sync for the B.L. Diagnostic Center application.

## Overview

The system uses Firebase Authentication for user management with a clever approach:
- **Login/Registration**: Uses mobile number + password
- **Email Strategy**: Converts mobile number to email format: `mobile@bldiagnostic.app`
- **Google Sheets Sync**: Server-side sync of registrations to a Google Sheet for the owner

## Architecture

```
User (Mobile + Password)
    ↓
Firebase Auth (creates/verifies account)
    ↓
Frontend gets ID token
    ↓
POST /api/register-sync (with token)
    ↓
Server verifies Firebase token
    ↓
Server appends row to Google Sheets
    ↓
Owner can view and call from sheet
```

## Prerequisites

- Firebase project with Authentication enabled
- Google Cloud project with Google Sheets API enabled
- Google Sheets spreadsheet
- Service account with Google Sheets access

## Step 1: Firebase Setup

### 1.1 Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Add project"
3. Follow the setup wizard
4. Enable project

### 1.2 Enable Authentication

1. In Firebase Console, go to "Authentication"
2. Click "Get Started"
3. Enable "Email/Password" sign-in provider
4. Click "Save"

### 1.3 Get Firebase Configuration

1. Go to Project Settings > General
2. Scroll to "Your apps" section
3. Click "Add Web App"
4. Copy the configuration values to `.env`:

```bash
VITE_FIREBASE_PROJECT_ID="your-project-id"
VITE_FIREBASE_APP_ID="your-app-id"
VITE_FIREBASE_API_KEY="your-api-key"
VITE_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
VITE_FIREBASE_STORAGE_BUCKET="your-project.firebasestorage.app"
VITE_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
```

### 1.4 Get Firebase Admin Service Account

1. Go to Project Settings > Service Accounts
2. Click "Generate New Private Key"
3. Download the JSON file
4. Copy the entire JSON content
5. Paste it into `.env` as a single line:

```bash
FIREBASE_ADMIN_SERVICE_ACCOUNT='{"type":"service_account","project_id":"your-project-id","private_key_id":"...","private_key":"...","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"..."}'
```

**Important**: This is backend-only configuration. Never commit this to version control.

## Step 2: Google Sheets Setup

### 2.1 Create Google Sheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new spreadsheet
3. Name it: "B.L. Diagnostic - Registrations"
4. Create a tab named "Registrations"

### 2.2 Set Up Headers

In the "Registrations" tab, add these headers in row 1:

| A | B | C | D | E | F |
|---|---|---|---|---|---|
| Registered At | Name | Mobile | Address | Call Status | Notes |

### 2.3 Add Data Validation for Call Status

1. Select column E (Call Status)
2. Go to Data > Data validation
3. Criteria: "Dropdown (from a range)" or "List of items"
4. Values: `New, Called, Booked, No answer`
5. Click "Done"

This allows the owner to quickly update call status.

### 2.4 Enable Google Sheets API

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project
3. Go to APIs & Services > Library
4. Search for "Google Sheets API"
5. Click "Enable"

### 2.5 Create Service Account

1. Go to APIs & Services > Credentials
2. Click "Create Credentials" > "Service Account"
3. Fill in details:
   - Service account name: `bl-diagnostic-sheets`
   - Service account description: `Service account for B.L. Diagnostic Sheets`
4. Click "Create and Continue"
5. Skip granting access (we'll do this next)
6. Click "Done"

### 2.6 Generate Service Account Key

1. Click on the created service account
2. Go to "Keys" tab
3. Click "Add Key" > "Create New Key"
4. Select "JSON" format
5. Download the key file
6. Secure it - never commit to version control

### 2.7 Share Sheet with Service Account

1. Open your Google Sheet
2. Click "Share"
3. Paste the service account email (from the JSON file)
4. Grant "Editor" permissions
5. Click "Send"

### 2.8 Configure Environment Variables

Add to `.env`:

```bash
GOOGLE_SHEETS_SPREADSHEET_ID="your-spreadsheet-id"
GOOGLE_SERVICE_ACCOUNT_EMAIL="your-service-account@your-project.iam.gserviceaccount.com"
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

**Note**: The spreadsheet ID is the long string in the URL:
`https://docs.google.com/spreadsheets/d/1ABC123xyz/edit` → ID is `1ABC123xyz`

**Note**: The private key should have `\n` characters for line breaks.

## Step 3: Server Configuration

The server is already configured with:

1. **Firebase Admin SDK initialization** - Verifies ID tokens
2. **Google Sheets API client** - Appends rows to sheet
3. **`/api/register-sync` endpoint** - Handles registration sync

No additional server configuration needed.

## Step 4: Testing

### 4.1 Test Registration

1. Start the development server:
```bash
npm run dev
```

2. Navigate to `http://localhost:3000/#register`

3. Fill in the form:
   - Name: `Test User`
   - Mobile: `9876543210`
   - Password: `test1234`
   - Address: `123 Test Street`

4. Click "Register"

5. Check the Google Sheet - a new row should appear:
   - Registered At: Current timestamp
   - Name: Test User
   - Mobile: +919876543210
   - Address: 123 Test Street
   - Call Status: New
   - Notes: (empty)

### 4.2 Test Login

1. Navigate to `http://localhost:3000/#login`

2. Enter:
   - Mobile: `9876543210`
   - Password: `test1234`

3. Click "Login"

4. Should successfully log in and redirect to dashboard

### 4.3 Test Token Verification

The server verifies Firebase ID tokens before writing to Google Sheets. This ensures:
- Only authenticated users can sync registrations
- Tokens are validated for expiration
- Prevents unauthorized sheet writes

## Step 5: Owner Workflow

### 5.1 View Registrations

1. Owner opens Google Sheet on phone/computer
2. Sees all registrations with mobile numbers
3. Can tap mobile number to call directly

### 5.2 Update Call Status

1. Owner opens sheet
2. Uses dropdown to update "Call Status":
   - New → Called → Booked / No answer
3. Can add notes in "Notes" column

### 5.3 Download as Excel

1. File > Download > Microsoft Excel (.xlsx)
2. Use for offline records or reporting

## Security Considerations

### Firebase Security

1. **Password Hashing**: Firebase handles password hashing automatically
2. **Token Verification**: Server verifies Firebase ID tokens
3. **Token Expiration**: Tokens expire after 1 hour (configurable)
4. **Email Format**: Hidden email strategy prevents direct email access

### Google Sheets Security

1. **Server-Side Writes**: Only server writes to sheets, not browser
2. **Private Keys**: Service account key never exposed to client
3. **Sheet Sharing**: Only share with authorized staff
4. **RAW Input**: Uses `RAW` mode to prevent formula injection

### Data Privacy

1. **Consent**: Registration form includes consent text
2. **Access Control**: Sheet shared only with owner/staff
3. **Data Minimization**: Only necessary data stored
4. **Compliance**: Follow data protection regulations

## Troubleshooting

### Registration Sync Fails

**Problem**: User registers but no row appears in Google Sheet

**Solutions**:
1. Check server logs for errors
2. Verify `GOOGLE_SHEETS_SPREADSHEET_ID` is correct
3. Verify service account has Editor access
4. Check Google Sheets API is enabled
5. Verify Firebase Admin SDK is initialized

### Firebase Token Verification Fails

**Problem**: `auth/invalid-id-token` or `auth/id-token-expired` error

**Solutions**:
1. Check `FIREBASE_ADMIN_SERVICE_ACCOUNT` is valid JSON
2. Verify Firebase project ID matches
3. Check token hasn't expired (1 hour default)
4. Ensure Firebase Authentication is enabled

### Mobile Number Validation Fails

**Problem**: "Invalid mobile number format" error

**Solutions**:
1. Ensure mobile is 10 digits
2. Ensure mobile starts with 6, 7, 8, or 9
3. Check no spaces or special characters

### Service Account Key Issues

**Problem**: Google Sheets API authentication fails

**Solutions**:
1. Regenerate service account key
2. Verify key format with `\n` for line breaks
3. Check service account email is correct
4. Ensure sheet is shared with service account

## Password Reset

Since we use hidden email, users cannot receive password reset emails. Options:

### Option 1: Owner Resets from Firebase Console

1. Owner goes to Firebase Console > Authentication
2. Finds user by mobile number (email: `mobile@bldiagnostic.app`)
3. Clicks user > Reset password
4. Enters new password
5. Communicates new password to user via phone

### Option 2: Ask for Real Email at Registration

Modify registration form to include real email field:
- Add email input to registration form
- Store email in Firebase user profile
- Use Firebase's built-in password reset flow

### Option 3: Custom Reset Flow

Implement custom password reset:
- Add "Forgot Password" link
- Send OTP to mobile (if SMS available)
- Allow password reset with OTP verification

## Sheet Failure Handling

If Google Sheets sync fails during registration:

1. **User still registered**: Firebase account is created
2. **Error logged**: Server logs the failure
3. **Manual sync**: Owner can manually add user to sheet
4. **Retry mechanism**: Implement retry logic (future enhancement)

To add retry logic, you could:
- Store failed syncs in database
- Add admin function to retry failed syncs
- Implement exponential backoff

## Privacy and Compliance

### Consent

The registration form includes:
> "By registering, you agree to be contacted by B.L. Diagnostic Center for test bookings and updates."

This is required for GDPR/privacy compliance.

### Data Access

- **Owner**: Full access to all registrations
- **Staff**: Access if sheet is shared with them
- **Users**: No access to other users' data
- **Public**: No access to registration data

### Data Retention

- **Firebase**: User data stored indefinitely
- **Google Sheets**: Data stored indefinitely
- **Recommendation**: Implement data retention policy (e.g., 7 years)

### Data Deletion

To delete user data:
1. Delete user from Firebase Authentication
2. Delete user data from Firestore (if used)
3. Remove row from Google Sheet manually

## Monitoring

### Monitor Registration Sync

Check server logs for:
- Successful syncs: `Registration synced to sheets: name, +91mobile`
- Failed syncs: `Sheet sync failed: error details`

### Monitor Firebase Authentication

Check Firebase Console > Authentication:
- User count
- Recent sign-ups
- Failed sign-in attempts

### Monitor Google Sheets

- Regular review of registrations
- Check for missing registrations
- Verify call status updates

## Cost Considerations

### Firebase Pricing

- **Spark Plan (Free)**: 
  - Authentication: Free
  - Limited to 10 concurrent connections
  - Suitable for development/small scale

- **Blaze Plan (Pay as you go)**:
  - Authentication: Free
  - Firestore: $0.18/GB stored
  - Suitable for production

### Google Sheets API

- **Free Tier**: 
  - 100 requests per 100 seconds per user
  - Sufficient for registration sync
  - No cost for typical usage

- **Paid Tier**:
  - Only if exceeding free tier
  - $5 per 1,000 additional requests

## Next Steps

After setup:

1. **Test thoroughly**: Register multiple test users
2. **Train owner**: Show owner how to use Google Sheet
3. **Monitor regularly**: Check syncs and sheet updates
4. **Implement retries**: Add retry logic for failed syncs
5. **Add analytics**: Track registration metrics
6. **Set up alerts**: Monitor for sync failures

## Support

For issues:
- Firebase Console: Check Authentication logs
- Google Cloud Console: Check API quotas and errors
- Server logs: Check for sync errors
- Email: bldiagnosticcentre@gmail.com
- Phone: +91 9649183422

## Summary

This setup provides:
- ✅ Secure Firebase Authentication (password hashing by Firebase)
- ✅ Simple owner workflow (Google Sheet with tap-to-call)
- ✅ Server-side sheet sync (private keys never exposed)
- ✅ Real-time updates (Google Sheets live sync)
- ✅ Excel export capability
- ✅ Privacy compliance (consent and access control)

The system is production-ready and scalable for the diagnostic center's needs.
