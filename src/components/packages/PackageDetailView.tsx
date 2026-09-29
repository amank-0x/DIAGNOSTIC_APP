import React, { useState, useEffect } from 'react';
import { HealthPackage } from '../../types/packages';
import { getPackageByIdFromDB } from '../../services/packageService';
import { PublicPage } from '../layout/Header';
import { BUSINESS_INFO } from '../../types';
import { 
  ArrowLeft, 
  Clock, 
  Droplet, 
  AlertCircle, 
  Calendar, 
  Check, 
  ShieldCheck, 
  RefreshCw,
  FlaskConical,
  HelpCircle
} from 'lucide-react';
import { Badge, Button } from '../ui/DesignSystem';

interface PackageDetailViewProps {
  packageId: string;
  onNavigate: (page: PublicPage, param?: string) => void;
  onBookThisPackage: (pkg: HealthPackage) => void;
  isBooked: boolean;
}

export const PackageDetailView: React.FC<PackageDetailViewProps> = ({
  packageId,
  onNavigate,
  onBookThisPackage,
  isBooked,
}) => {
  const [pkg, setPkg] = useState<HealthPackage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getPackageByIdFromDB(packageId).then(data => {
      setPkg(data);
      setLoading(false);
    });
  }, [packageId]);

  if (loading) {
    return (
      <div className="py-24 text-center space-y-3">
        <RefreshCw className="w-8 h-8 animate-spin text-[#0F294A] mx-auto" />
        <p className="text-xs font-semibold text-slate-600">Retrieving package details from database...</p>
      </div>
    );
  }

  if (!pkg) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center bg-white rounded-2xl border border-slate-200 p-8 space-y-4">
        <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-800">Package Not Found</h2>
        <p className="text-xs text-slate-500">
          The requested package ID <span className="font-mono font-bold">{packageId}</span> was not found in the database.
        </p>
        <button
          onClick={() => onNavigate('packages')}
          className="text-xs font-bold text-emerald-700 hover:underline"
        >
          Return to Health Packages
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-24">
      {/* Back button */}
      <button
        onClick={() => onNavigate('packages')}
        className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to All Packages
      </button>

      {/* Package Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="border-b border-slate-100 pb-5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded">
              PACKAGE CODE: {pkg.package_id}
            </span>
            {pkg.needs_review ? (
              <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                REVIEW REQUIRED (Poster Reference)
              </span>
            ) : (
              <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                Confirmed B.L. Health Package
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
            {pkg.package_name}
          </h1>

          {pkg.needs_review && pkg.review_reason && (
            <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900">
              <strong>Source Verification Warning:</strong> {pkg.review_reason}
            </div>
          )}

          {pkg.description ? (
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {pkg.description}
            </p>
          ) : (
            <p className="text-xs font-mono text-slate-400">[CONTENT REQUIRED]</p>
          )}
        </div>

        {/* Pricing & Booking Banner */}
        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Total Package Price
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-3xl font-black text-[#0F294A]">₹{pkg.price}</span>
              <span className="text-xs text-slate-500">(All inclusive bundle rate)</span>
            </div>
            <span className="text-[11px] text-slate-500 block mt-1">
              Payment mode: Direct settlement at home collection or center visit.
            </span>
          </div>

          <Button
            variant="secondary"
            size="lg"
            onClick={() => onBookThisPackage(pkg)}
            className="w-full sm:w-auto"
          >
            {isBooked ? (
              <>
                <Check className="w-4 h-4 text-white" />
                Added to Appointment
              </>
            ) : (
              <>
                <Calendar className="w-4 h-4 text-white" />
                Book This Package
              </>
            )}
          </Button>
        </div>

        {/* Requirements Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 text-xs space-y-1">
            <span className="text-slate-400 font-semibold block">Fasting Requirement</span>
            <p className="font-bold text-slate-800">
              {pkg.fasting_required ? `${pkg.fasting_hours || 10} Hours Overnight Fasting` : 'No Fasting Required'}
            </p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 text-xs space-y-1">
            <span className="text-slate-400 font-semibold block">Turnaround Time</span>
            <p className="font-bold text-slate-800">
              {pkg.turnaround_time || 'Same Day'}
            </p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 text-xs space-y-1">
            <span className="text-slate-400 font-semibold block">Sample Collection</span>
            <p className="font-bold text-emerald-800">
              Home Collection or Center Visit
            </p>
          </div>
        </div>

        {/* Detailed Included Tests / Parameters Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Included Diagnostic Tests ({pkg.items.length} Parameters)
            </h3>
            <span className="text-xs text-slate-500">
              All parameters evaluated simultaneously
            </span>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 bg-white">
            {pkg.items.map((item, idx) => (
              <div key={item.item_id || idx} className="p-3.5 flex items-center justify-between gap-4 hover:bg-slate-50 text-xs">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-[11px] shrink-0">
                    {idx + 1}
                  </span>
                  <div>
                    <h4 className="font-bold text-slate-900">{item.test_name}</h4>
                    {item.test_id && (
                      <span className="font-mono text-[10px] text-slate-400">
                        Linked Code: {item.test_id}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {item.category && (
                    <span className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded text-[11px] font-semibold">
                      {item.category}
                    </span>
                  )}
                  {item.test_id && (
                    <button
                      onClick={() => onNavigate('test-details', item.test_id)}
                      className="text-emerald-700 hover:underline font-semibold text-[11px]"
                    >
                      View Test Details
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer info */}
        <div className="border-t border-slate-100 pt-4 flex flex-col sm:flex-row justify-between text-xs text-slate-500 gap-2">
          <span>{BUSINESS_INFO.name} • {BUSINESS_INFO.address}</span>
          <span className="font-semibold text-slate-700">Phone: +91 {BUSINESS_INFO.phone}</span>
        </div>
      </div>
    </div>
  );
};
