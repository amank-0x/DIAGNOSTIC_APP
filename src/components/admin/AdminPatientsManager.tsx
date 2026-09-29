import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  RefreshCw, 
  Calendar, 
  Phone, 
  Mail, 
  User, 
  Clock, 
  CheckCircle2, 
  ChevronRight,
  ClipboardList
} from 'lucide-react';
import { AdminPatientListItem } from '../../types/admin';
import { fetchAdminPatients } from '../../services/adminService';

export const AdminPatientsManager: React.FC = () => {
  const [patients, setPatients] = useState<AdminPatientListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [genderFilter, setGenderFilter] = useState('ALL');
  const [selectedPatient, setSelectedPatient] = useState<AdminPatientListItem | null>(null);

  const loadPatients = async () => {
    setLoading(true);
    try {
      const data = await fetchAdminPatients();
      setPatients(data);
    } catch (err) {
      console.error('Failed to load patients:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatients();
  }, []);

  const filteredPatients = patients.filter(p => {
    const q = search.toLowerCase();
    const matchesSearch = 
      p.full_name.toLowerCase().includes(q) ||
      (p.phone && p.phone.includes(q)) ||
      (p.user_email && p.user_email.toLowerCase().includes(q)) ||
      (p.user_name && p.user_name.toLowerCase().includes(q)) ||
      p.patient_id.toLowerCase().includes(q);

    const matchesGender = genderFilter === 'ALL' || p.gender === genderFilter;
    return matchesSearch && matchesGender;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            Registered Patients & Family Records
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Centrally view all patients registered across individual and family accounts, with linked user identity and booking count.
          </p>
        </div>

        <button
          onClick={loadPatients}
          disabled={loading}
          className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Patients
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by patient name, phone, linked user email, or patient ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-indigo-600 bg-white"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={genderFilter}
            onChange={(e) => setGenderFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-700 focus:outline-hidden"
          >
            <option value="ALL">All Genders</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>

      {/* Patients Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-3.5">Patient Details</th>
                <th className="px-4 py-3.5">Age / Gender</th>
                <th className="px-4 py-3.5">Relationship</th>
                <th className="px-4 py-3.5">Linked User Account</th>
                <th className="px-4 py-3.5">Phone</th>
                <th className="px-4 py-3.5 text-center">Bookings</th>
                <th className="px-4 py-3.5">Added Date</th>
                <th className="px-4 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
                    Loading patient database...
                  </td>
                </tr>
              ) : filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No matching patient profiles found.
                  </td>
                </tr>
              ) : (
                filteredPatients.map((p) => (
                  <tr key={p.patient_id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-slate-900">{p.full_name}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {p.patient_id}
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="font-semibold text-slate-800">{p.age} yrs</span> • {p.gender}
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-medium">
                        {p.relation}
                      </span>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="font-medium text-slate-800">{p.user_name || 'Registered User'}</div>
                      <div className="text-[11px] text-slate-500">{p.user_email || p.user_id}</div>
                    </td>

                    <td className="px-4 py-3.5">
                      {p.phone ? (
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>+91 {p.phone}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Inherited from user</span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-center">
                      <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full text-[11px]">
                        {p.bookingsCount ?? 0}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-slate-500 whitespace-nowrap">
                      {new Date(p.created_at).toLocaleDateString()}
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      <button
                        onClick={() => setSelectedPatient(p)}
                        className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Patient Detail Modal */}
      {selectedPatient && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">{selectedPatient.full_name}</h3>
                <span className="text-xs font-mono text-indigo-600">{selectedPatient.patient_id}</span>
              </div>
              <button
                onClick={() => setSelectedPatient(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Age & Gender</span>
                <span className="font-bold text-slate-800 text-sm mt-0.5 block">{selectedPatient.age} years • {selectedPatient.gender}</span>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Relationship</span>
                <span className="font-bold text-slate-800 text-sm mt-0.5 block">{selectedPatient.relation}</span>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Direct Phone</span>
                <span className="font-bold text-slate-800 mt-0.5 block">{selectedPatient.phone ? `+91 ${selectedPatient.phone}` : 'Not specified'}</span>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Total Linked Bookings</span>
                <span className="font-bold text-indigo-700 text-sm mt-0.5 block">{selectedPatient.bookingsCount ?? 0} requests</span>
              </div>
            </div>

            <div className="bg-indigo-50/70 p-3.5 rounded-xl border border-indigo-200 text-xs space-y-1">
              <span className="font-bold text-indigo-950 block">Account Ownership Security Verification</span>
              <p className="text-indigo-900">
                Linked User: <strong>{selectedPatient.user_name || 'Patient User'}</strong> ({selectedPatient.user_email || 'No email'})
              </p>
              <p className="text-[11px] text-indigo-800">
                User UID: <span className="font-mono">{selectedPatient.user_id}</span>
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedPatient(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
