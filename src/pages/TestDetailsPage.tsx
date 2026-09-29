import React from 'react';
import { DiagnosticTest, BUSINESS_INFO } from '../types';
import { OFFICIAL_RATE_LIST } from '../data/rateList';
import { PublicPage } from '../components/layout/Header';
import { ArrowLeft, Clock, Droplet, AlertCircle, ShieldCheck, Check } from 'lucide-react';
import { Badge, Button } from '../components/ui/DesignSystem';

interface TestDetailsPageProps {
  testId?: string;
  onNavigate: (page: PublicPage) => void;
  onBookTest: (test: DiagnosticTest) => void;
  isTestSelected: boolean;
}

export const TestDetailsPage: React.FC<TestDetailsPageProps> = ({
  testId,
  onNavigate,
  onBookTest,
  isTestSelected,
}) => {
  const test = OFFICIAL_RATE_LIST.find(t => t.id === testId) || OFFICIAL_RATE_LIST[0];

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20">
      <button
        onClick={() => onNavigate('tests')}
        className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to All Tests
      </button>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="border-b border-slate-100 pb-4 space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="green">{test.category}</Badge>
            <span className="font-mono text-xs text-slate-400">TEST CODE: {test.code}</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900">{test.name}</h1>
          <p className="text-xs text-slate-600 leading-relaxed">{test.description}</p>
        </div>

        {/* Specimen & Turnaround Specifics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
            <span className="text-slate-500 block mb-1">Specimen Required</span>
            <span className="font-bold text-slate-800">{test.sampleType} Sample</span>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
            <span className="text-slate-500 block mb-1">Turnaround Time</span>
            <span className="font-bold text-slate-800">{test.turnaroundTime}</span>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
            <span className="text-slate-500 block mb-1">Fasting Requirement</span>
            <span className="font-bold text-slate-800">
              {test.fastingRequired ? `Yes (${test.fastingHours || 8} hrs fasting)` : 'No Fasting Needed'}
            </span>
          </div>
        </div>

        {/* Pricing & Booking Action */}
        <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <span className="text-xs text-emerald-800 font-semibold block">Official Rate List Price</span>
            <span className="text-3xl font-black text-[#0F294A]">₹{test.price}</span>
            <span className="text-[11px] text-slate-500 block mt-0.5">Pay at collection or center visit</span>
          </div>

          <Button
            variant="secondary"
            size="md"
            onClick={() => onBookTest(test)}
          >
            {isTestSelected ? 'Added to Appointment' : 'Book This Test'}
          </Button>
        </div>

        {/* Business notes */}
        <div className="text-xs text-slate-500 space-y-1">
          <p>• Samples can be collected via <strong>Home Collection</strong> or at our center near Post Office, Kumbha Marg, Pratap Nagar.</p>
          <p>• Results verified by laboratory pathologists at {BUSINESS_INFO.name}.</p>
        </div>
      </div>
    </div>
  );
};
