import React, { useState, useEffect } from 'react';
import { HealthPackage } from '../../types/packages';
import { getAllPackagesFromDB } from '../../services/packageService';
import { PublicPage } from '../layout/Header';
import { Check, Layers } from 'lucide-react';
import {
  Button,
  SkeletonGrid,
  EmptyState,
  ContentRequiredBadge,
} from '../ui/DesignSystem';

interface PublicPackagesPageProps {
  onNavigate: (page: PublicPage, param?: string) => void;
  onBookPackage: (pkg: HealthPackage) => void;
  bookedPackageIds: string[];
}

export const PublicPackagesPage: React.FC<PublicPackagesPageProps> = ({
  onNavigate,
  onBookPackage,
  bookedPackageIds,
}) => {
  const [packages, setPackages] = useState<HealthPackage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const list = await getAllPackagesFromDB(true);
      setPackages(list);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="space-y-8 pb-20">
        <div className="bg-[#0F294A] rounded-2xl p-6 sm:p-10 text-white">
          <h1 className="text-2xl sm:text-4xl font-extrabold">Health Packages</h1>
          <p className="text-slate-300 text-xs sm:text-sm mt-2">
            Loading diagnostic health packages...
          </p>
        </div>
        <SkeletonGrid count={3} columns={3} />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      {/* Header Banner */}
      <div className="bg-[#0F294A] rounded-2xl p-6 sm:p-10 text-white border border-slate-800">
        <div className="max-w-3xl space-y-2.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 block">
            B.L. Diagnostic Center · Preventive Profiles
          </span>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Health Packages
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
            Comprehensive pathology checkup packages available for doorstep Home Sample Collection or Center Visit in Pratap Nagar, Jaipur.
          </p>
        </div>
      </div>

      {packages.length === 0 ? (
        <EmptyState
          title="Health Packages Information Pending"
          description="Official diagnostic health package configurations are being updated."
          actionText="Browse Individual Tests"
          onAction={() => onNavigate('tests')}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {packages.map((pkg) => {
            const isBooked = bookedPackageIds.includes(pkg.package_id);
            return (
              <article
                key={pkg.package_id}
                className={`bg-white rounded-xl border p-6 flex flex-col justify-between transition-all ${
                  isBooked
                    ? 'border-[#059669] ring-1 ring-[#059669]/40 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 shadow-2xs'
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs border-b border-slate-100 pb-2.5">
                    <span className="font-bold text-[#0F294A] flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
                      <span>{pkg.items.length} Included Tests</span>
                    </span>
                    <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                      Home Collection
                    </span>
                  </div>

                  <div>
                    <h2 className="text-lg font-extrabold text-[#0F294A]">
                      {pkg.package_name}
                    </h2>
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                      {pkg.description ? pkg.description : <ContentRequiredBadge />}
                    </p>
                  </div>

                  {/* Included Tests Preview */}
                  <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200/80 space-y-2">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      Included Tests ({pkg.items.length})
                    </span>
                    {pkg.items.length > 0 ? (
                      <ul className="space-y-1.5 text-xs text-slate-700">
                        {pkg.items.slice(0, 4).map((it, i) => (
                          <li key={i} className="flex items-center gap-2">
                            <Check
                              className="w-3.5 h-3.5 text-emerald-600 shrink-0"
                              aria-hidden="true"
                            />
                            <span className="truncate">{it.test_name}</span>
                          </li>
                        ))}
                        {pkg.items.length > 4 && (
                          <li className="text-[11px] font-semibold text-emerald-700 pl-5">
                            + {pkg.items.length - 4} more tests included
                          </li>
                        )}
                      </ul>
                    ) : (
                      <ContentRequiredBadge />
                    )}
                  </div>
                </div>

                {/* Price & Actions */}
                <div className="pt-4 mt-5 border-t border-slate-100 space-y-3">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-slate-500 font-medium">
                      Package Price
                    </span>
                    <span className="text-2xl font-extrabold text-[#0F294A] tabular-nums">
                      ₹{pkg.price}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onNavigate('package-details', pkg.package_id)}
                      className="w-full"
                    >
                      View Package
                    </Button>
                    <Button
                      variant={isBooked ? 'primary' : 'secondary'}
                      size="sm"
                      onClick={() => onBookPackage(pkg)}
                      className="w-full"
                    >
                      {isBooked ? 'Selected' : 'Book Package'}
                    </Button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
