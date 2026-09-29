import React, { useState, useEffect } from 'react';
import { RateRecord } from '../../types/catalogue';
import { getTestByIdFromDB } from '../../services/catalogueService';
import { PublicPage } from '../layout/Header';
import { BUSINESS_INFO } from '../../types';
import {
  ArrowLeft,
  Check,
  Droplet,
  Clock,
  FileText,
  Home,
  Phone,
  MapPin,
  AlertCircle,
  FlaskConical,
} from 'lucide-react';
import { Button, ContentRequiredBadge, LoadingState } from '../ui/DesignSystem';

interface TestDetailViewProps {
  testId: string;
  onNavigate: (page: PublicPage, param?: string) => void;
  onBookThisTest: (record: RateRecord) => void;
  isBooked: boolean;
}

export const TestDetailView: React.FC<TestDetailViewProps> = ({
  testId,
  onNavigate,
  onBookThisTest,
  isBooked,
}) => {
  const [record, setRecord] = useState<RateRecord | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'sample' | 'preparation' | 'reporting'>('overview');

  useEffect(() => {
    setLoading(true);
    getTestByIdFromDB(testId)
      .then((res) => {
        setRecord(res);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [testId]);

  if (loading) {
    return <LoadingState message="Loading diagnostic test specifications..." />;
  }

  if (!record) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center bg-white rounded-xl border border-slate-200 p-8 space-y-4">
        <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
        <h1 className="text-lg font-bold text-[#0F294A]">Diagnostic Test Not Found</h1>
        <p className="text-xs text-slate-600">
          The requested test code ({testId}) could not be found in the catalogue.
        </p>
        <Button variant="primary" size="sm" onClick={() => onNavigate('tests')}>
          Return to Tests Catalogue
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      {/* Back navigation */}
      <button
        type="button"
        onClick={() => onNavigate('tests')}
        className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-[#0F294A] transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" aria-hidden="true" />
        <span>Back to Diagnostic Tests Catalogue</span>
      </button>

      {/* Two-Column Layout: Left = Test Clinical Information, Right = Sticky Booking Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Primary Header Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-2xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3 text-xs">
              <span className="font-bold text-[#0F294A] uppercase tracking-wider">
                Category: {record.category}
              </span>
              <span className="font-mono text-slate-500">Test Code: {record.test_id}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F294A] tracking-tight">
              {record.test_name}
            </h1>

            <p className="text-slate-700 text-sm sm:text-base leading-relaxed">
              {record.clinical_information || record.test_name}
            </p>
          </div>

          {/* Key Specifications Grid: Sample Type, Method, Reporting Time */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                <Droplet className="w-4 h-4 text-emerald-600" aria-hidden="true" />
                <span>Sample Type</span>
              </div>
              <p className="text-sm font-bold text-slate-900">
                {record.sample || 'Blood Sample'}
              </p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                <FlaskConical className="w-4 h-4 text-[#0F294A]" aria-hidden="true" />
                <span>Method</span>
              </div>
              <p className="text-sm font-bold text-slate-900">
                {record.method || <ContentRequiredBadge />}
              </p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                <Clock className="w-4 h-4 text-emerald-600" aria-hidden="true" />
                <span>Reporting Time</span>
              </div>
              <div className="text-sm font-bold text-slate-900">
                {record.reporting_time || <ContentRequiredBadge />}
              </div>
            </div>
          </div>

          {/* Tabbed Clinical Information Sections: Overview, Sample, Preparation, Reporting */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="flex items-center border-b border-slate-200 bg-slate-50 overflow-x-auto">
              {[
                { id: 'overview', label: 'Overview' },
                { id: 'sample', label: 'Sample' },
                { id: 'preparation', label: 'Preparation' },
                { id: 'reporting', label: 'Reporting' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveTab(t.id as any)}
                  className={`px-5 py-3 text-xs font-bold border-b-2 whitespace-nowrap cursor-pointer transition-colors ${
                    activeTab === t.id
                      ? 'border-[#059669] text-[#0F294A] bg-white'
                      : 'border-transparent text-slate-600 hover:text-[#0F294A]'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="p-6 space-y-3 text-xs sm:text-sm text-slate-700 leading-relaxed">
              {activeTab === 'overview' && (
                <div className="space-y-2">
                  <h2 className="text-sm font-bold text-[#0F294A] flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-600" />
                    <span>Clinical Overview</span>
                  </h2>
                  <p>
                    {record.clinical_information || (
                      <ContentRequiredBadge text="[CONTENT REQUIRED]" />
                    )}
                  </p>
                </div>
              )}

              {activeTab === 'sample' && (
                <div className="space-y-2">
                  <h2 className="text-sm font-bold text-[#0F294A]">Sample Specification</h2>
                  <p>
                    <strong>Required Specimen:</strong> {record.sample || 'Blood'}
                  </p>
                  {record.method && (
                    <p>
                      <strong>Testing Method:</strong> {record.method}
                    </p>
                  )}
                </div>
              )}

              {activeTab === 'preparation' && (
                <div className="space-y-2">
                  <h2 className="text-sm font-bold text-[#0F294A]">
                    Sample &amp; Preparation Instructions
                  </h2>
                  <p>
                    {record.sample_instructions ||
                      'Standard sample collection protocol. Follow your clinician instructions.'}
                  </p>
                </div>
              )}

              {activeTab === 'reporting' && (
                <div className="space-y-2">
                  <h2 className="text-sm font-bold text-[#0F294A]">Reporting Schedule</h2>
                  <p>
                    <strong>Estimated Reporting Time:</strong>{' '}
                    {record.reporting_time || <ContentRequiredBadge />}
                  </p>
                  <p className="text-xs text-slate-500">
                    Released digital reports can be downloaded from your Patient Portal dashboard.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: STICKY BOOKING CARD (4 Cols) */}
        <aside className="lg:col-span-4 lg:sticky lg:top-28">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
            <div className="border-b border-slate-100 pb-4 flex items-baseline justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500 block">
                  Test Price
                </span>
                {record.general_price !== null ? (
                  <span className="text-3xl font-extrabold text-[#0F294A] tabular-nums">
                    ₹{record.general_price}
                  </span>
                ) : (
                  <ContentRequiredBadge />
                )}
              </div>
              <span className="text-xs font-semibold text-emerald-700">
                Pay at Center
              </span>
            </div>

            {/* Collection Options */}
            <div className="space-y-2.5 text-xs text-slate-700">
              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-emerald-50/70 border border-emerald-200">
                <Home className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <span className="font-bold text-emerald-950 block">
                    Home Collection Available
                  </span>
                  <span className="text-emerald-800">
                    Schedule doorstep sample collection online.
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-slate-50 border border-slate-200">
                <MapPin className="w-4 h-4 text-[#0F294A] shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <span className="font-bold text-slate-900 block">
                    Center Visit Available
                  </span>
                  <span className="text-slate-600">{BUSINESS_INFO.address}</span>
                </div>
              </div>
            </div>

            {/* Primary CTA Button */}
            <div className="space-y-2.5 pt-1">
              <Button
                variant="secondary"
                size="lg"
                onClick={() => onBookThisTest(record)}
                className="w-full"
              >
                {isBooked ? (
                  <>
                    <Check className="w-4 h-4" aria-hidden="true" />
                    <span>Selected — Proceed to Book</span>
                  </>
                ) : (
                  <span>BOOK THIS TEST</span>
                )}
              </Button>
            </div>

            {/* Direct Phone Support */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">24/7 Support:</span>
              <a
                href={`tel:${BUSINESS_INFO.phone}`}
                className="inline-flex items-center gap-1.5 font-bold text-[#0F294A] hover:text-emerald-700 tabular-nums"
              >
                <Phone className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
                <span>{BUSINESS_INFO.phone}</span>
              </a>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};
