import React from 'react';
import { DiagnosticTest, BUSINESS_INFO } from '../types';
import { OFFICIAL_RATE_LIST } from '../data/rateList';
import { PublicPage } from '../components/layout/Header';
import { Button, Badge } from '../components/ui/DesignSystem';

interface PackagesPageProps {
  onNavigate: (page: PublicPage) => void;
  onBookPackage: (pkg: DiagnosticTest) => void;
}

export const PackagesPage: React.FC<PackagesPageProps> = ({
  onNavigate,
  onBookPackage,
}) => {
  const packages = OFFICIAL_RATE_LIST.filter(t => t.category === 'Preventive Health Packages');

  return (
    <div className="space-y-6 pb-20">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
          Preventive Health Packages
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Bundled routine checkup profiles with transparent rates from B.L. Diagnostic Center.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {packages.map(pkg => (
          <div key={pkg.id} className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between space-y-4 shadow-xs">
            <div className="space-y-3">
              <Badge variant="green">Code: {pkg.code}</Badge>
              <h3 className="text-lg font-bold text-slate-900">{pkg.name}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{pkg.description}</p>
              <div className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded-lg font-medium">
                {pkg.fastingRequired ? '10-12 Hours Fasting Recommended' : 'No fasting required'}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 block font-semibold">Total Rate</span>
                <span className="text-2xl font-black text-[#0F294A]">₹{pkg.price}</span>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onBookPackage(pkg)}
              >
                Book Package
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
