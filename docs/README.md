# B.L. Diagnostic Center - Diagnostic Application

A modern, full-stack diagnostic center management system built with React, TypeScript, Express, Firebase, and Google Sheets integration.

## Overview

B.L. Diagnostic Center is a comprehensive web application for managing diagnostic test bookings, patient information, home collection services, and administrative operations. The system provides a seamless experience for patients to book tests, track their bookings, and access reports, while offering administrators powerful tools for managing operations.

## Key Features

### For Patients
- **Test Catalogue**: Browse and search through a comprehensive list of diagnostic tests
- **Health Packages**: View and book preventive health packages
- **Online Booking**: Book tests with center visit or home collection options
- **Mobile OTP Authentication**: Secure login using Indian mobile numbers
- **Booking Tracking**: Real-time status updates on bookings
- **Report Access**: Secure access to diagnostic reports
- **Patient Management**: Add and manage multiple patients per account

### For Administrators
- **Dashboard**: Overview of bookings, patients, and key metrics
- **Booking Management**: View, update, and manage all bookings
- **Patient Management**: Manage patient records and information
- **Test Management**: Add, edit, and deactivate diagnostic tests
- **Package Management**: Create and manage health packages
- **Home Collection**: Manage home collection requests and assignments
- **Lead Management**: Track and convert leads from contact forms
- **Google Sheets Sync**: Two-way synchronization with Google Sheets for reporting
- **Audit Logs**: Track all administrative actions
- **Report Management**: Secure report upload and distribution

## Technology Stack

### Frontend
- **React 19**: UI framework
- **TypeScript**: Type-safe development
- **Vite**: Build tool and dev server
- **Tailwind CSS 4**: Utility-first CSS framework
- **Motion**: Animation library
- **Lucide React**: Icon library
- **Google Maps**: Location services

### Backend
- **Node.js**: Runtime environment
- **Express**: Web framework
- **TypeScript**: Type-safe backend
- **Firebase (Firestore)**: Primary database
- **Google Sheets API**: Operational reporting layer
- **Google Auth**: OAuth and service account authentication

### Authentication
- **Mobile OTP**: Server-side OTP generation and verification
- **SMS Integration**: MSG91 / Fast2SMS / Twilio support
- **Session Management**: Secure server-side sessions
- **Role-Based Access**: USER, STAFF, ADMIN roles

### Infrastructure
- **PostgreSQL**: Primary database (via Prisma)
- **Firebase Cloud Firestore**: NoSQL database
- **Google Sheets**: Operational reporting and sync
- **Vite**: Development server with HMR

## Project Structure

```
DIAGNOSTIC_APP/
├── docs/                    # Documentation
├── prisma/                  # Database schema
├── public/                  # Static assets
├── src/
│   ├── components/          # React components
│   │   ├── admin/          # Admin panel components
│   │   ├── auth/           # Authentication components
│   │   ├── booking/        # Booking flow components
│   │   ├── catalogue/      # Test catalogue components
│   │   ├── dashboard/      # User dashboard components
│   │   ├── layout/         # Layout components
│   │   ├── map/            # Map components
│   │   ├── packages/       # Package components
│   │   ├── reports/        # Report components
│   │   └── ui/             # UI design system
│   ├── contexts/            # React contexts
│   ├── data/                # Static data (tests, packages)
│   ├── lib/                 # Utility libraries
│   ├── pages/               # Page components
│   ├── server/              # Backend server code
│   │   ├── auth/           # Authentication logic
│   │   └── sheets/         # Google Sheets integration
│   ├── services/            # API services
│   ├── types/               # TypeScript type definitions
│   ├── App.tsx              # Main application component
│   └── main.tsx             # Application entry point
├── .env.example             # Environment variables template
├── .env                     # Environment variables (gitignored)
├── firebase-applet-config.json  # Firebase configuration
├── firestore.rules          # Firestore security rules
├── index.html               # HTML entry point
├── package.json             # Dependencies and scripts
├── server.ts                # Express server entry point
├── tsconfig.json            # TypeScript configuration
└── vite.config.ts           # Vite configuration
```

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or bun
- Google Cloud account (for Google Sheets)
- Firebase project
- SMS provider account (MSG91/Fast2SMS/Twilio)

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd DIAGNOSTIC_APP
```

2. Install dependencies
```bash
npm install
# or
bun install
```

3. Configure environment variables
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Start the development server
```bash
npm run dev
```

5. Open http://localhost:3000 in your browser

## Environment Variables

See [`.env.example`](../.env.example) for all required environment variables. Key variables include:

- `NODE_ENV`: Environment (development/production)
- `PORT`: Server port (default: 3000)
- `SMS_PROVIDER`: SMS gateway (MSG91/FAST2SMS/TWILIO)
- `SMS_API_KEY`: SMS provider API key
- `OTP_SECRET`: Secret for OTP HMAC generation
- `SESSION_SECRET`: Secret for session encryption
- `VITE_FIREBASE_*`: Firebase configuration
- `VITE_GOOGLE_MAPS_API_KEY`: Google Maps API key
- `GOOGLE_SHEETS_SPREADSHEET_ID`: Google Sheets spreadsheet ID
- `GOOGLE_SERVICE_ACCOUNT_EMAIL`: Service account email
- `GOOGLE_PRIVATE_KEY`: Service account private key
- `DATABASE_URL`: PostgreSQL connection string

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run preview` - Preview production build
- `npm run lint` - Run TypeScript type checking
- `npm run clean` - Clean build artifacts

## Documentation

- [Architecture](./ARCHITECTURE.md) - System architecture and design
- [API Documentation](./API.md) - API endpoints and usage
- [Deployment Guide](./DEPLOYMENT.md) - Deployment instructions
- [Development Guide](./DEVELOPMENT.md) - Development setup and workflows

## Security Considerations

- **Never commit** `.env` file or any secrets to version control
- **OTP generation** happens server-side only
- **Session tokens** are stored in HttpOnly cookies
- **Rate limiting** is enforced on all API endpoints
- **No passwords** are stored - mobile OTP authentication only
- **Role-based access** enforced on both client and server
- **Google Sheets sync** excludes sensitive data (passwords, tokens, secrets)

## Support

For support, contact:
- Email: bldiagnosticcentre@gmail.com
- Phone: +91 9649183422
- Address: Near Post Office, Kumbha Marg, Sector 11, Pratap Nagar, Jaipur - 302033

## License

Copyright © 2026 B.L. Diagnostic Center. All rights reserved.
