import React, { useState } from 'react';
import { MapPin, Phone, Navigation, Clock, Check, Copy, ExternalLink, Compass } from 'lucide-react';

interface LaboratoryMapProps {
  heightClassName?: string;
}

export const LaboratoryMap: React.FC<LaboratoryMapProps> = ({
  heightClassName = 'min-h-[300px]',
}) => {
  const [copied, setCopied] = useState(false);

  const addressText = 'Near Post Office, Kumbha Marg, Sector 11, Pratap Nagar, Jaipur - 302033';
  const directionsUrl =
    'https://www.google.com/maps/search/?api=1&query=Near+Post+Office,+Kumbha+Marg,+Sector+11,+Pratap+Nagar,+Jaipur+302033';

  const handleCopyAddress = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(addressText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div
      className={`w-full ${heightClassName} rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-xs flex flex-col md:flex-row`}
    >
      {/* Visual Map / Location Illustration */}
      <div className="relative md:w-5/12 bg-slate-100 flex flex-col justify-between p-5 border-b md:border-b-0 md:border-r border-slate-200 overflow-hidden">
        {/* Subtle grid and street map graphic */}
        <div className="absolute inset-0 opacity-25 pointer-events-none">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="street-grid" width="60" height="60" patternUnits="userSpaceOnUse">
                <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#64748b" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#street-grid)" />
            {/* Main roads */}
            <line x1="0" y1="50%" x2="100%" y2="50%" stroke="#0F294A" strokeWidth="8" strokeOpacity="0.3" />
            <line x1="50%" y1="0" x2="50%" y2="100%" stroke="#059669" strokeWidth="6" strokeOpacity="0.25" />
            <line x1="20%" y1="0" x2="90%" y2="100%" stroke="#94a3b8" strokeWidth="3" strokeOpacity="0.4" />
          </svg>
        </div>

        {/* Center Marker Card */}
        <div className="relative z-10 flex items-start gap-3 bg-white/95 backdrop-blur-xs p-3.5 rounded-xl border border-slate-200/90 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-[#0F294A] text-white flex items-center justify-center shrink-0 shadow-xs">
            <MapPin className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="min-w-0">
            <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 mb-0.5">
              Verified Location
            </span>
            <h4 className="font-bold text-sm text-[#0F294A] truncate">B.L. Diagnostic Center</h4>
            <p className="text-xs text-slate-600 font-medium">Sector 11, Pratap Nagar, Jaipur</p>
          </div>
        </div>

        {/* Landmark Callout */}
        <div className="relative z-10 mt-4 bg-emerald-50/90 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-950">
          <div className="flex items-center gap-1.5 font-bold mb-1">
            <Compass className="w-3.5 h-3.5 text-emerald-700" />
            <span>Key Landmark</span>
          </div>
          <p className="text-[11px] text-emerald-900 leading-snug">
            Directly opposite / near Post Office on Kumbha Marg. Easily accessible by car, two-wheeler, or public transit.
          </p>
        </div>

        {/* Direction Action in Map Panel */}
        <div className="relative z-10 mt-3 pt-2">
          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-[#0F294A] hover:bg-[#16365D] text-white text-xs font-bold py-2.5 px-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-xs"
          >
            <Navigation className="w-3.5 h-3.5 text-emerald-400" />
            <span>Open in Maps for Directions</span>
            <ExternalLink className="w-3 h-3 text-slate-300 ml-auto" />
          </a>
        </div>
      </div>

      {/* Address & Timings Details */}
      <div className="flex-1 p-5 sm:p-6 flex flex-col justify-between">
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] uppercase font-bold text-slate-600 tracking-wider">
                Full Physical Address
              </span>
              <button
                type="button"
                onClick={handleCopyAddress}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1 transition-colors cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Address</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-sm font-semibold text-slate-900 mt-1 leading-relaxed">
              Near Post Office, Kumbha Marg,<br />
              Sector 11, Pratap Nagar,<br />
              Jaipur, Rajasthan — 302033
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#0F294A]">
                <Clock className="w-3.5 h-3.5 text-emerald-600" />
                <span>Operating Timings</span>
              </div>
              <p className="text-xs text-slate-700 font-semibold mt-1">
                Mon – Sat: 07:00 AM – 08:00 PM
              </p>
              <p className="text-[11px] text-slate-500">
                Sunday: 07:00 AM – 02:00 PM
              </p>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#0F294A]">
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                <span>Helpline & Queries</span>
              </div>
              <a
                href="tel:9649183422"
                className="text-xs text-emerald-700 hover:text-emerald-800 font-bold block mt-1 tabular-nums"
              >
                +91 9649183422
              </a>
              <p className="text-[11px] text-slate-500">
                Doorstep collection assistance
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-600">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Sample collection available across Pratap Nagar</span>
          </div>

          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-bold text-emerald-700 hover:underline inline-flex items-center gap-1"
          >
            <span>Get Turn-by-Turn Navigation</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
};
