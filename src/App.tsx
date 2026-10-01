import React, { useState, useEffect } from 'react';
import { Header, PublicPage } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { HomePage } from './pages/HomePage';
import { TestsPage } from './pages/TestsPage';
import { TestDetailsPage } from './pages/TestDetailsPage';
import { TestsCatalogue } from './components/catalogue/TestsCatalogue';
import { TestDetailView } from './components/catalogue/TestDetailView';
import { PublicPackagesPage } from './components/packages/PublicPackagesPage';
import { PackageDetailView } from './components/packages/PackageDetailView';
import { PackagesPage } from './pages/PackagesPage';
import { HomeCollectionPage } from './pages/HomeCollectionPage';
import { ContactPage } from './pages/ContactPage';
import { InfoPages } from './pages/InfoPages';
import { CompleteBookingEngine } from './components/booking/CompleteBookingEngine';
import { UserDashboardView } from './components/dashboard/UserDashboardView';
import { AdminPanel } from './components/AdminPanel';
import { AuthProvider } from './contexts/AuthContext';
import { AuthView } from './components/auth/AuthView';
import { FirebaseAuthView } from './components/auth/FirebaseAuthView';
import { UserDashboard } from './components/dashboard/UserDashboard';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { DiagnosticTest } from './types';
import { RateRecord } from './types/catalogue';
import { HealthPackage } from './types/packages';
import { initializeDatabaseSeed } from './services/bookingService';
import { initializeCatalogueDatabase } from './services/catalogueService';
import { initializePackagesDatabase } from './services/packageService';
import { AdminRoute } from './types/admin';

export default function App() {
  const [currentPage, setCurrentPage] = useState<PublicPage>('home');
  const [selectedTestId, setSelectedTestId] = useState<string>('BLD-T001');
  const [selectedPackageId, setSelectedPackageId] = useState<string>('BLD-PKG01');
  const [selectedTests, setSelectedTests] = useState<DiagnosticTest[]>([]);
  const [trackedBookingId, setTrackedBookingId] = useState<string>('');
  const [adminSubTab, setAdminSubTab] = useState<AdminRoute>('dashboard');

  useEffect(() => {
    initializeDatabaseSeed();
    initializeCatalogueDatabase();
    initializePackagesDatabase();

    // Check for admin or deep-link hash
    const hash = window.location.hash.replace('#', '').trim();
    if (hash.startsWith('admin/')) {
      const sub = hash.replace('admin/', '') as AdminRoute;
      setAdminSubTab(sub);
      setCurrentPage('admin');
    } else if (hash === 'admin') {
      setCurrentPage('admin');
    }
  }, []);

  const handleNavigate = (page: PublicPage, param?: string) => {
    if (param && page === 'test-details') {
      setSelectedTestId(param);
    }
    if (param && (page === 'packages' || page === 'package-details')) {
      setSelectedPackageId(param);
      setCurrentPage('package-details');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (page === 'admin') {
      if (param) setAdminSubTab(param as AdminRoute);
    }
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const convertPackageToDiagnosticTest = (pkg: HealthPackage): DiagnosticTest => {
    return {
      id: pkg.package_id,
      name: pkg.package_name,
      category: 'Preventive Health Packages',
      code: pkg.package_id,
      price: pkg.price,
      sampleType: 'Blood',
      fastingRequired: pkg.fasting_required,
      fastingHours: pkg.fasting_hours,
      turnaroundTime: pkg.turnaround_time || 'Same Day',
      description: pkg.description || pkg.package_name
    };
  };

  const handleBookFromPackage = (pkg: HealthPackage) => {
    const test = convertPackageToDiagnosticTest(pkg);
    handleSelectTestAndBook(test);
  };

  const convertRecordToDiagnosticTest = (record: RateRecord): DiagnosticTest => {
    return {
      id: record.test_id,
      name: record.test_name,
      category: record.category as any,
      code: record.test_id,
      price: record.general_price ?? 0,
      sampleType: (record.sample?.includes('Urine') ? 'Urine' : record.sample?.includes('Serum') ? 'Serum' : 'Blood') as any,
      fastingRequired: record.sample_instructions ? record.sample_instructions.toLowerCase().includes('fasting') : false,
      turnaroundTime: record.reporting_time || 'Same Day',
      description: record.clinical_information || record.test_name
    };
  };

  const handleToggleTestFromRecord = (record: RateRecord) => {
    const test = convertRecordToDiagnosticTest(record);
    handleToggleTest(test);
  };

  const handleBookFromRecord = (record: RateRecord) => {
    const test = convertRecordToDiagnosticTest(record);
    handleSelectTestAndBook(test);
  };

  const handleToggleTest = (test: DiagnosticTest) => {
    setSelectedTests(prev => {
      const exists = prev.some(t => t.id === test.id);
      if (exists) {
        return prev.filter(t => t.id !== test.id);
      } else {
        return [...prev, test];
      }
    });
  };

  const handleSelectTestAndBook = (test: DiagnosticTest) => {
    if (!selectedTests.some(t => t.id === test.id)) {
      setSelectedTests(prev => [...prev, test]);
    }
    setCurrentPage('book');
  };

  const handleAddTest = (test: DiagnosticTest) => {
    if (!selectedTests.some(t => t.id === test.id)) {
      setSelectedTests(prev => [...prev, test]);
    }
  };

  const handleRemoveTest = (testId: string) => {
    setSelectedTests(prev => prev.filter(t => t.id !== testId));
  };

  const handleClearSelectedTests = () => {
    setSelectedTests([]);
  };

  const handleNavigateToTracking = (bookingId: string) => {
    setTrackedBookingId(bookingId);
    setCurrentPage('dashboard');
  };

  return (
    <AuthProvider>
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 selection:bg-emerald-100 selection:text-emerald-900 antialiased">
        {/* Universal Header with Brand Navigation */}
        <Header
          currentPage={currentPage}
          onNavigate={handleNavigate}
          selectedTestsCount={selectedTests.length}
        />

        {/* Main Page Body Routing */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {currentPage === 'home' && (
            <HomePage
              onNavigate={handleNavigate}
              onSelectTestAndBook={handleSelectTestAndBook}
              onToggleTest={handleToggleTest}
              selectedTests={selectedTests}
            />
          )}

          {currentPage === 'about' && (
            <InfoPages type="about" onNavigate={handleNavigate} />
          )}

          {currentPage === 'services' && (
            <InfoPages type="services" onNavigate={handleNavigate} />
          )}

          {currentPage === 'tests' && (
            <TestsCatalogue
              onNavigate={handleNavigate}
              selectedTestIds={selectedTests.map(t => t.id)}
              onToggleTestById={handleToggleTestFromRecord}
              onProceedToBooking={() => setCurrentPage('book')}
            />
          )}

          {currentPage === 'test-details' && (
            <TestDetailView
              testId={selectedTestId}
              onNavigate={handleNavigate}
              onBookThisTest={handleBookFromRecord}
              isBooked={selectedTests.some(t => t.id === selectedTestId)}
            />
          )}

          {currentPage === 'packages' && (
            <PublicPackagesPage
              onNavigate={handleNavigate}
              onBookPackage={handleBookFromPackage}
              bookedPackageIds={selectedTests.map(t => t.id)}
            />
          )}

          {currentPage === 'package-details' && (
            <PackageDetailView
              packageId={selectedPackageId}
              onNavigate={handleNavigate}
              onBookThisPackage={handleBookFromPackage}
              isBooked={selectedTests.some(t => t.id === selectedPackageId)}
            />
          )}

          {currentPage === 'home-collection' && (
            <HomeCollectionPage onNavigate={handleNavigate} />
          )}

          {currentPage === 'book' && (
            <CompleteBookingEngine
              selectedTests={selectedTests}
              onAddTest={handleAddTest}
              onRemoveTest={handleRemoveTest}
              onClearSelectedTests={handleClearSelectedTests}
              onNavigateToCatalog={() => setCurrentPage('tests')}
              onNavigate={handleNavigate}
            />
          )}

          {currentPage === 'contact' && (
            <ContactPage onNavigate={handleNavigate} />
          )}

          {currentPage === 'faq' && (
            <InfoPages type="faq" onNavigate={handleNavigate} />
          )}

          {currentPage === 'login' && (
            <FirebaseAuthView
              initialMode="login"
              onNavigate={handleNavigate}
            />
          )}

          {currentPage === 'register' && (
            <FirebaseAuthView
              initialMode="register"
              onNavigate={handleNavigate}
            />
          )}

          {/* User Dashboard: Protected Route (Requires USER, STAFF, or ADMIN) */}
          {currentPage === 'dashboard' && (
            <ProtectedRoute onNavigate={handleNavigate}>
              <UserDashboardView 
                onNavigate={handleNavigate}
                initialBookingId={trackedBookingId} 
              />
            </ProtectedRoute>
          )}

          {/* Admin Panel: Protected Route (Server-side enforced strictly for STAFF or ADMIN) */}
          {currentPage === 'admin' && (
            <ProtectedRoute allowedRoles={['ADMIN', 'STAFF']} onNavigate={handleNavigate}>
              <AdminPanel initialTab={adminSubTab} />
            </ProtectedRoute>
          )}
        </main>

        {/* Universal Footer */}
        <Footer onNavigate={handleNavigate} />
      </div>
    </AuthProvider>
  );
}
