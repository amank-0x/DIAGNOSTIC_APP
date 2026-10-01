# Architecture Documentation

## System Overview

B.L. Diagnostic Center follows a modern full-stack architecture with clear separation between frontend, backend, and data layers. The system uses a hybrid database approach combining Firebase Firestore for real-time operations and Google Sheets for operational reporting.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend Layer                           │
│  React 19 + TypeScript + Tailwind CSS + Vite                    │
├─────────────────────────────────────────────────────────────────┤
│  Pages                    │  Components                         │
│  - HomePage               │  - BookingFlow                      │
│  - TestsPage              │  - TestCatalog                      │
│  - PackagesPage           │  - UserDashboard                     │
│  - ContactPage            │  - AdminPanel                       │
│  - InfoPages              │  - AuthView                         │
│                           │  - ReportViewer                     │
├─────────────────────────────────────────────────────────────────┤
│  Contexts                 │  Services                           │
│  - AuthContext            │  - authService                      │
│                           │  - bookingService                   │
│                           │  - catalogueService                  │
│                           │  - sheetsService                    │
└─────────────────────────────────────────────────────────────────┘
                              │ HTTP/REST
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Backend Layer                            │
│  Express + TypeScript + Node.js                                 │
├─────────────────────────────────────────────────────────────────┤
│  Middleware                                                       
│  - Rate Limiting                                                 
│  - Security Headers                                              
│  - Request Logging                                              
├─────────────────────────────────────────────────────────────────┤
│  API Endpoints                                                     
│  /api/auth/*           - Authentication (OTP, session)           
│  /api/sheets/*         - Google Sheets integration               
│  /api/health           - Health check                            
└─────────────────────────────────────────────────────────────────┘
                              │
         ┌────────────────────┼────────────────────┐
         ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  Firebase       │  │  Google Sheets  │  │  SMS Provider   │
│  Firestore      │  │  API v4         │  │  (MSG91/etc)    │
│                 │  │                 │  │                 │
│  Collections:   │  │  Tabs:          │  │  - OTP Send     │
│  - users        │  │  - Users        │  │  - Resend OTP   │
│  - bookings     │  │  - Patients     │  │                 │
│  - patients     │  │  - Bookings     │  │                 │
│  - leads        │  │  - Tests        │  │                 │
│  - reports      │  │  - Packages     │  │                 │
│                 │  │  - Time Slots   │  │                 │
│                 │  │  - Sync Logs    │  │                 │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

## Frontend Architecture

### Component Structure

The frontend follows a component-based architecture with clear separation of concerns:

```
src/
├── components/
│   ├── admin/              # Admin-specific components
│   │   ├── AdminDashboardOverview.tsx
│   │   ├── AdminBookingsManager.tsx
│   │   ├── AdminPatientsManager.tsx
│   │   ├── AdminTestsManager.tsx
│   │   ├── AdminPackageEditor.tsx
│   │   ├── AdminGoogleSheetsSyncManager.tsx
│   │   └── ...
│   ├── auth/               # Authentication components
│   │   ├── AuthView.tsx
│   │   └── ProtectedRoute.tsx
│   ├── booking/            # Booking flow components
│   │   └── CompleteBookingEngine.tsx
│   ├── catalogue/          # Test catalogue components
│   │   ├── TestsCatalogue.tsx
│   │   └── TestDetailView.tsx
│   ├── dashboard/          # User dashboard components
│   │   ├── UserDashboard.tsx
│   │   ├── UserDashboardView.tsx
│   │   └── PatientManager.tsx
│   ├── layout/             # Layout components
│   │   ├── Header.tsx
│   │   └── Footer.tsx
│   ├── packages/           # Package components
│   │   ├── PublicPackagesPage.tsx
│   │   └── PackageDetailView.tsx
│   ├── reports/            # Report components
│   │   ├── UserReportsView.tsx
│   │   └── SecureReportViewerModal.tsx
│   └── ui/                 # UI design system
│       └── DesignSystem.tsx
├── contexts/
│   └── AuthContext.tsx     # Authentication state management
├── pages/                  # Page-level components
│   ├── HomePage.tsx
│   ├── TestsPage.tsx
│   ├── PackagesPage.tsx
│   ├── ContactPage.tsx
│   └── ...
├── services/               # API service layer
│   ├── authService.ts
│   ├── bookingService.ts
│   ├── catalogueService.ts
│   └── ...
└── types/                  # TypeScript definitions
    ├── index.ts
    ├── auth.ts
    ├── bookingSystem.ts
    └── ...
```

### State Management

The application uses React Context for global state management:

- **AuthContext**: Manages user authentication state, session, and role-based access
- Local component state for UI-specific state (selected tests, booking form data, etc.)
- Firebase Firestore real-time listeners for data synchronization

### Routing

The application uses client-side routing with hash-based navigation:
- Home: `#/home`
- Tests: `#/tests`
- Booking: `#/book`
- Dashboard: `#/dashboard`
- Admin: `#/admin` or `#/admin/{tab}`

## Backend Architecture

### Server Structure

The backend is built with Express and follows a modular structure:

```
server.ts                 # Main server entry point
├── src/server/
│   ├── auth/
│   │   └── otpAuthService.ts    # OTP generation, verification, session management
│   └── sheets/
│       ├── googleSheetsAuth.ts        # Google authentication management
│       ├── googleSheetsMapper.ts       # Entity-to-sheet mapping
│       ├── googleSheetsService.ts      # Sheet operations (CRUD)
│       ├── googleSheetsSync.ts         # Sync orchestration
│       └── googleSheetsRetry.ts        # Retry logic for failed syncs
```

### API Design

All API endpoints follow RESTful conventions:

#### Authentication Endpoints
- `POST /api/auth/send-otp` - Request OTP for mobile number
- `POST /api/auth/resend-otp` - Resend OTP with cooldown
- `POST /api/auth/verify-otp` - Verify OTP and create session
- `GET /api/auth/session` - Get current session user
- `PUT /api/auth/profile` - Update user profile
- `POST /api/auth/logout` - End session

#### Google Sheets Endpoints
- `GET /api/sheets/status` - Get Google Sheets connection status
- `POST /api/sheets/set-spreadsheet` - Configure spreadsheet connection
- `POST /api/sheets/initial-sync` - Initial data backfill to sheets
- `POST /api/sheets/sync-patient` - Sync patient to sheets
- `POST /api/sheets/sync-lead` - Sync lead to sheets
- `POST /api/sheets/retry-failed` - Retry failed sync operations

#### Health Endpoint
- `GET /api/health` - Health check and system status

### Middleware

The server uses several middleware layers:

1. **Security Headers**
   - X-Content-Type-Options: nosniff
   - Referrer-Policy: strict-origin-when-cross-origin
   - X-XSS-Protection: 1; mode=block
   - Strict-Transport-Security (production only)

2. **Rate Limiting**
   - Per-IP rate limiting
   - Configurable window and max requests
   - 429 response with Retry-After header

3. **Request Logging**
   - API request logging with duration
   - Configurable log levels

4. **Body Parsing**
   - JSON body parser with 5MB limit

## Data Layer Architecture

### Hybrid Database Approach

The system uses a hybrid database strategy:

#### Primary Database: Firebase Firestore
- **Purpose**: Real-time operations, user data, bookings, patients
- **Collections**:
  - `users`: User profiles and authentication data
  - `bookings`: Booking records and status
  - `patients`: Patient information
  - `leads`: Contact form leads
  - `reports`: Report metadata and access control

#### Operational Layer: Google Sheets
- **Purpose**: Reporting, analytics, manual operations, data export
- **Tabs** (9 canonical tabs):
  1. **Users**: User registration and activity data
  2. **Patients**: Patient demographics and records
  3. **Bookings**: All booking records with full details
  4. **Home Collection**: Home collection requests and status
  5. **Leads**: Lead management and conversion tracking
  6. **Tests**: Test catalog with pricing
  7. **Packages**: Health packages and pricing
  8. **Time Slots**: Available time slots and capacity
  9. **Sync Logs**: Sync operation tracking and error logs

### Data Flow

#### Booking Flow
```
User selects tests → CompleteBookingEngine → bookingService.createBooking()
    ↓
Firestore: Create booking document
    ↓
Google Sheets: Sync to Bookings tab (async, non-blocking)
    ↓
User: Confirmation and tracking ID
```

#### Authentication Flow
```
User enters mobile → sendMobileOtp() → POST /api/auth/send-otp
    ↓
Server: Generate 6-digit OTP, hash, store in memory
    ↓
SMS Provider: Send OTP to user's mobile
    ↓
User enters OTP → verifyMobileOtp() → POST /api/auth/verify-otp
    ↓
Server: Verify OTP hash, create/update user in memory store
    ↓
Firestore: Sync user profile (async)
    ↓
Google Sheets: Sync to Users tab (async, non-blocking)
    ↓
Client: Store session token, set AuthContext state
```

#### Sync Flow
```
Entity change (booking/user/patient) → syncEntityToGoogleSheets()
    ↓
googleSheetsSync: Queue sync operation
    ↓
googleSheetsService: Map entity to sheet row
    ↓
Google Sheets API: upsert row (with duplicate prevention)
    ↓
Success: Log to Sync Logs tab
    ↓
Failure: Queue for retry with exponential backoff
```

## Security Architecture

### Authentication

1. **Mobile OTP Authentication**
   - Server-side OTP generation (6-digit numeric)
   - SHA-256 hashing before storage
   - 5-minute expiry (configurable)
   - 30-second resend cooldown
   - Maximum 5 attempts per OTP

2. **Session Management**
   - Server-side session store (in-memory)
   - HttpOnly, Secure, SameSite=None cookies
   - Session token in Authorization header fallback
   - Configurable session expiry

3. **Role-Based Access Control**
   - Roles: USER, STAFF, ADMIN
   - Client-side: ProtectedRoute component
   - Server-side: Role verification on sensitive endpoints
   - Admin mobile numbers whitelisted in environment

### Data Security

1. **Sensitive Data Exclusion**
   - Never sync passwords, OTPs, session tokens to Google Sheets
   - Private keys and secrets never exposed to client
   - Service account credentials server-side only

2. **Input Validation**
   - Indian mobile number validation (+91XXXXXXXXXX)
   - Sheet formula injection prevention (sanitize =, +, -, @)
   - Type validation on all API inputs

3. **Rate Limiting**
   - Per-IP rate limiting on all API endpoints
   - OTP-specific rate limits (sends per window)
   - Configurable limits per environment

### API Security

1. **CORS**
   - Configurable allowed origins
   - Strict origin checking in production

2. **Headers**
   - Security headers on all responses
   - Content-Type enforcement
   - XSS protection

3. **Environment Variables**
   - All secrets in environment variables
   - .env file gitignored
   - Separate dev/staging/prod configs

## Google Sheets Integration

### Authentication Methods

The system supports two authentication methods for Google Sheets:

1. **Service Account** (Recommended for production)
   - Service account email and private key
   - Automated, no user interaction required
   - Best for server-side operations

2. **OAuth Token** (For admin setup)
   - User OAuth token via Authorization header
   - Interactive authorization in admin panel
   - Useful for initial setup and testing

### Sync Strategy

1. **Async, Non-Blocking**
   - Sync operations don't block primary operations
   - Firestore writes complete before sheet sync
   - UI responsive regardless of sync status

2. **Duplicate Prevention**
   - Primary key lookup before insert
   - Update if exists, insert if new
   - Unique ID-based deduplication

3. **Retry Logic**
   - Failed syncs queued for retry
   - Exponential backoff (3s, 6s, 12s, ...)
   - Maximum 5 retry attempts
   - Detailed error logging

4. **Row Mapping**
   - Strict schema mapping per tab
   - Type conversion and formatting
   - Security sanitization (formula injection prevention)

### Sheet Schema

Each tab has a defined schema in `googleSheetsMapper.ts`:
- Column headers
- Data types
- Primary key columns
- Validation rules

## Performance Considerations

### Frontend
- Code splitting via Vite
- Lazy loading of admin components
- Optimized bundle size
- Efficient re-renders with React 19

### Backend
- Async operations for non-critical paths
- Rate limiting to prevent abuse
- Efficient sync batching
- Connection pooling for database

### Database
- Firestore indexes for common queries
- Batch operations for bulk writes
- Real-time listeners only where needed
- Document size optimization

## Scalability

### Horizontal Scaling
- Stateless server design
- Session store can be externalized (Redis)
- Database handles scaling (Firebase auto-scales)
- Google Sheets API handles concurrent requests

### Vertical Scaling
- Efficient memory usage
- Async operations prevent blocking
- Connection pooling
- Optimistic UI updates

## Monitoring and Observability

### Logging
- API request logging with duration
- Sync operation logging
- Error logging with context
- Configurable log levels

### Health Checks
- `/api/health` endpoint
- Service status reporting
- Database connectivity checks
- Google Sheets connection status

### Metrics
- Sync success/failure rates
- API response times
- Rate limit metrics
- User activity tracking

## Deployment Architecture

### Development
- Vite dev server with HMR
- Hot module replacement
- Fast refresh
- Environment-based configuration

### Production
- Built static assets (Vite build)
- Express serves static files
- API routes on same server
- CDN for static assets (optional)

### Infrastructure Recommendations
- Load balancer for horizontal scaling
- Redis for session storage (production)
- Database backups (Firebase auto-backups)
- Google Sheets backup strategy
- SSL/TLS termination
- CDN for static assets

## Future Enhancements

### Planned Features
- PostgreSQL as primary database (via Prisma)
- Enhanced reporting with data visualization
- SMS template management
- Multi-location support
- Integration with lab equipment APIs
- Automated report generation
- Payment gateway integration
- Mobile app (React Native)

### Architecture Improvements
- Microservices for specific domains
- Event-driven architecture
- GraphQL API layer
- Advanced caching strategy
- Real-time notifications (WebSocket)
- Advanced analytics pipeline
