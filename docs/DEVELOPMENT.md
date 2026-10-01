# Development Guide

This guide covers development setup, workflows, and best practices for contributing to the B.L. Diagnostic Center application.

## Table of Contents

- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Debugging](#debugging)
- [Adding Features](#adding-features)
- [Google Sheets Development](#google-sheets-development)
- [Firebase Development](#firebase-development)
- [Common Tasks](#common-tasks)
- [Troubleshooting](#troubleshooting)

## Development Setup

### Prerequisites

- Node.js 18+ 
- npm or bun
- Git
- VS Code (recommended) or any IDE
- Google Chrome (for development)

### 1. Clone Repository

```bash
git clone <repository-url>
cd DIAGNOSTIC_APP
```

### 2. Install Dependencies

```bash
npm install
# or
bun install
```

### 3. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with development values:
- Use placeholder Firebase configuration
- Use placeholder Google Sheets credentials
- Set `NODE_ENV=development`
- Use test SMS provider credentials or leave empty for sandbox mode

### 4. Start Development Server

```bash
npm run dev
```

The server will start at `http://localhost:3000`

### 5. Open in Browser

Navigate to `http://localhost:3000`

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
│   ├── data/                # Static data
│   ├── lib/                 # Utility libraries
│   ├── pages/               # Page components
│   ├── server/              # Backend server code
│   ├── services/            # API services
│   ├── types/               # TypeScript definitions
│   ├── App.tsx              # Main application
│   └── main.tsx             # Entry point
├── .env                     # Environment variables (gitignored)
├── .env.example             # Environment template
├── package.json             # Dependencies
├── server.ts                # Express server
├── tsconfig.json            # TypeScript config
└── vite.config.ts           # Vite config
```

## Development Workflow

### Branch Strategy

- `main` - Production code
- `develop` - Integration branch
- `feature/*` - Feature branches
- `bugfix/*` - Bug fix branches
- `hotfix/*` - Emergency production fixes

### Creating a Feature Branch

```bash
git checkout develop
git pull origin develop
git checkout -b feature/your-feature-name
```

### Making Changes

1. Make your changes
2. Test locally
3. Commit with clear message
4. Push to remote
5. Create pull request

### Commit Message Format

```
type(scope): subject

body

footer
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style (formatting)
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance

Examples:
```
feat(booking): add home collection scheduling
fix(auth): resolve OTP resend cooldown issue
docs(api): update authentication endpoints
```

### Pull Request Process

1. Create PR from feature branch to `develop`
2. Fill PR template
3. Request review
4. Address feedback
5. Merge after approval

## Coding Standards

### TypeScript

- Use strict TypeScript settings
- Avoid `any` type
- Use interfaces for object shapes
- Use type aliases for unions
- Enable noImplicitAny

```typescript
// Good
interface User {
  id: string;
  name: string;
  email?: string;
}

// Bad
const user: any = { id: 1, name: 'John' };
```

### React

- Use functional components with hooks
- Avoid class components
- Use TypeScript for props
- Extract reusable logic into custom hooks
- Keep components small and focused

```typescript
// Good
interface UserProfileProps {
  user: User;
  onUpdate: (user: User) => void;
}

export function UserProfile({ user, onUpdate }: UserProfileProps) {
  const [editing, setEditing] = useState(false);
  // ...
}

// Bad
class UserProfile extends React.Component {
  // ...
}
```

### Naming Conventions

- Components: PascalCase (`UserProfile`)
- Functions: camelCase (`getUserProfile`)
- Constants: UPPER_SNAKE_CASE (`API_BASE_URL`)
- Files: camelCase for utilities, PascalCase for components
- Directories: kebab-case (`user-profile/`)

### File Organization

- One component per file
- Group related files in directories
- Use index files for exports
- Keep utilities in `lib/`
- Keep types in `types/`

### Code Style

- Use 2 spaces for indentation
- Use single quotes for strings
- Use semicolons
- Max line length: 100 characters
- Use prettier for formatting

### Comments

- Use JSDoc for functions
- Comment complex logic
- Avoid obvious comments
- Keep comments up to date

```typescript
/**
 * Authenticates user with mobile number and OTP
 * @param mobileNumber - Indian mobile number (+91XXXXXXXXXX)
 * @param otp - 6-digit OTP code
 * @returns User profile if successful
 */
async function authenticateUser(mobileNumber: string, otp: string): Promise<User> {
  // ...
}
```

## Testing

### Running Tests

```bash
npm test
```

### Writing Tests

- Unit tests for utilities
- Component tests for UI
- Integration tests for services
- E2E tests for critical flows

### Test Structure

```
src/
├── components/
│   └── UserProfile/
│       ├── UserProfile.tsx
│       └── UserProfile.test.tsx
├── services/
│   ├── authService.ts
│   └── authService.test.ts
```

## Debugging

### Client-Side Debugging

1. Open Chrome DevTools (F12)
2. Use React DevTools extension
3. Check Console for errors
4. Use debugger statements
5. Network tab for API calls

### Server-Side Debugging

1. Check server logs in terminal
2. Use `console.log` for debugging
3. Use VS Code debugger
4. Check environment variables

### Common Debugging Techniques

```typescript
// Console logging
console.log('User data:', user);
console.error('Error:', error);

// Debugger
debugger;

// Conditional logging
if (process.env.NODE_ENV === 'development') {
  console.log('Debug info:', data);
}
```

## Adding Features

### Adding a New Page

1. Create page component in `src/pages/`
2. Add route in `App.tsx`
3. Add navigation in `Header.tsx`
4. Test the page

```typescript
// src/pages/NewPage.tsx
export function NewPage() {
  return (
    <div>
      <h1>New Page</h1>
    </div>
  );
}

// App.tsx
{currentPage === 'new-page' && <NewPage onNavigate={handleNavigate} />}

// Header.tsx
<Button onClick={() => onNavigate('new-page')}>New Page</Button>
```

### Adding a New Component

1. Create component in appropriate directory
2. Add TypeScript types
3. Implement component logic
4. Export from index if needed
5. Use in parent component

```typescript
// src/components/common/NewComponent.tsx
interface NewComponentProps {
  title: string;
  onAction: () => void;
}

export function NewComponent({ title, onAction }: NewComponentProps) {
  return (
    <div>
      <h2>{title}</h2>
      <button onClick={onAction}>Action</button>
    </div>
  );
}
```

### Adding a New API Endpoint

1. Add endpoint in `server.ts`
2. Implement logic in service layer
3. Add request/response types
4. Test with curl or Postman
5. Update API documentation

```typescript
// server.ts
app.post('/api/new-endpoint', async (req: Request, res: Response) => {
  try {
    const data = req.body;
    // Process data
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});
```

### Adding a New Service

1. Create service file in `src/services/`
2. Implement API calls
3. Add TypeScript types
4. Handle errors
5. Export functions

```typescript
// src/services/newService.ts
export async function fetchData(): Promise<Data[]> {
  const res = await fetch('/api/data');
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
}
```

## Google Sheets Development

### Local Development Without Google Sheets

The system can run without Google Sheets configured. Sync operations will fail gracefully.

### Testing Google Sheets Integration

1. Create test spreadsheet
2. Configure service account
3. Set spreadsheet ID in `.env`
4. Test sync operations
5. Verify data in spreadsheet

### Adding New Sheet Tab

1. Add tab name to `OFFICIAL_CANONICAL_TABS` in `googleSheetsMapper.ts`
2. Define headers in `WORKSHEET_HEADERS`
3. Add mapping logic in `mapEntityToSheetRow`
4. Test sync operation

```typescript
// src/server/sheets/googleSheetsMapper.ts
export const OFFICIAL_CANONICAL_TABS: CanonicalTabName[] = [
  // ... existing tabs
  'NewTab',
];

export const WORKSHEET_HEADERS: Record<CanonicalTabName, string[]> = {
  // ... existing headers
  'NewTab': ['Column 1', 'Column 2', 'Column 3'],
};

export function mapEntityToSheetRow(rawTab: WorksheetTabName, record: Record<string, any>) {
  const tab = normalizeTabName(rawTab);
  switch (tab) {
    case 'NewTab':
      return [
        cleanCell(record.field1),
        cleanCell(record.field2),
        cleanCell(record.field3),
      ];
    // ... other cases
  }
}
```

## Firebase Development

### Local Emulator

Use Firebase emulators for local development:

```bash
firebase emulators:start
```

Update Firebase config to use emulator:

```typescript
// src/lib/firebase.ts
if (process.env.NODE_ENV === 'development') {
  connectFirestoreEmulator(db, 'localhost', 8080);
}
```

### Firestore Rules Testing

Test rules locally:

```bash
firebase emulators:start --only firestore
firebase experimental:rules:test
```

### Adding New Collection

1. Define collection name
2. Add TypeScript types
3. Create service functions
4. Add security rules
5. Test CRUD operations

```typescript
// src/types/newType.ts
export interface NewEntity {
  id: string;
  name: string;
  createdAt: string;
}

// src/services/newService.ts
export async function createNewEntity(data: Partial<NewEntity>): Promise<NewEntity> {
  const docRef = await addDoc(collection(db, 'newCollection'), {
    ...data,
    createdAt: new Date().toISOString(),
  });
  return { id: docRef.id, ...data } as NewEntity;
}
```

## Common Tasks

### Adding a New Test to Catalogue

1. Add test to `src/data/rateListRecords.ts`
2. Restart development server
3. Test appears in catalogue

```typescript
// src/data/rateListRecords.ts
export const INITIAL_RATE_LIST_RECORDS: RateRecord[] = [
  // ... existing tests
  {
    test_id: 'BLD-T999',
    test_name: 'New Test',
    category: 'Clinical Pathology',
    sample: 'Blood',
    general_price: 500,
    reporting_time: 'Same Day',
    clinical_information: 'Test description',
    sample_instructions: 'No special instructions',
    method: 'Automated',
    is_active: true,
  },
];
```

### Adding a New Package

1. Add package to `src/data/packagesData.ts`
2. Restart development server
3. Package appears in packages page

```typescript
// src/data/packagesData.ts
export const INITIAL_PACKAGES_DATA: HealthPackage[] = [
  // ... existing packages
  {
    package_id: 'BLD-PKG99',
    package_name: 'New Health Package',
    description: 'Package description',
    price: 2000,
    tests_included: ['BLD-T001', 'BLD-T002'],
    fasting_required: true,
    fasting_hours: 10,
    turnaround_time: '2 Days',
    is_active: true,
  },
];
```

### Updating Environment Variables

1. Edit `.env` file
2. Restart development server
3. Changes take effect immediately

### Updating Dependencies

```bash
# Check for updates
npm outdated

# Update specific package
npm update package-name

# Update all packages
npm update

# Audit for vulnerabilities
npm audit
npm audit fix
```

### Type Checking

```bash
npm run lint
```

This runs TypeScript compiler to check for type errors.

### Building for Production

```bash
npm run build
```

Build artifacts are created in `dist/` directory.

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>

# Or use different port
PORT=3001 npm run dev
```

### Module Not Found

```bash
# Clear cache
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
rm -rf dist .vite
```

### TypeScript Errors

```bash
# Check TypeScript version
npm list typescript

# Reinstall TypeScript
npm install --save-dev typescript@latest

# Check tsconfig.json
cat tsconfig.json
```

### Firebase Connection Issues

1. Check Firebase configuration in `.env`
2. Verify Firebase project exists
3. Check network connectivity
4. Review Firebase console for errors

### Google Sheets Sync Fails

1. Check service account credentials
2. Verify spreadsheet access
3. Check API quota
4. Review sync logs
5. Test with simple sync operation

### OTP Not Sending in Development

1. Check SMS provider API key
2. Verify sandbox mode is working
3. Check console for OTP (sandbox mode)
4. Verify mobile number format

### Build Fails

```bash
# Clean build
npm run clean
npm run build

# Check Node version
node --version  # Should be 18+

# Update dependencies
npm update
```

### Hot Module Replacement Not Working

1. Check Vite config
2. Clear Vite cache
3. Restart dev server
4. Check browser console for errors

## Performance Optimization

### Code Splitting

Use dynamic imports for code splitting:

```typescript
const AdminPanel = lazy(() => import('./components/AdminPanel'));

<Suspense fallback={<Loading />}>
  <AdminPanel />
</Suspense>
```

### Image Optimization

- Use WebP format
- Compress images
- Use lazy loading
- Implement responsive images

### Bundle Size Optimization

```bash
# Analyze bundle size
npm run build
npx vite-bundle-visualizer
```

### Database Optimization

- Use Firestore indexes
- Optimize queries
- Implement pagination
- Cache frequently accessed data

## Best Practices

### Security

- Never commit secrets
- Validate all inputs
- Use environment variables
- Implement rate limiting
- Keep dependencies updated
- Use HTTPS in production

### Performance

- Lazy load components
- Optimize images
- Minimize re-renders
- Use memoization
- Implement caching

### Maintainability

- Write clean code
- Add comments for complex logic
- Follow consistent style
- Keep functions small
- Use meaningful names

### Accessibility

- Use semantic HTML
- Add ARIA labels
- Ensure keyboard navigation
- Test with screen readers
- Provide alt text for images

## Resources

### Documentation

- [React Documentation](https://react.dev)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)
- [Vite Documentation](https://vitejs.dev)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Google Sheets API](https://developers.google.com/sheets/api)

### Tools

- [VS Code](https://code.visualstudio.com)
- [React DevTools](https://react.dev/learn/react-developer-tools)
- [Postman](https://www.postman.com)
- [Git](https://git-scm.com)

### Community

- Stack Overflow
- GitHub Issues
- Discord/Slack communities

## Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Test thoroughly
5. Submit pull request
6. Address feedback
7. Merge after approval

## License

Copyright © 2026 B.L. Diagnostic Center. All rights reserved.
