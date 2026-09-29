import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Save, 
  RefreshCw, 
  MapPin, 
  Phone, 
  Clock, 
  Mail, 
  Home, 
  CheckCircle2, 
  Bell,
  FileSpreadsheet
} from 'lucide-react';
import { CenterSettings } from '../../types/admin';
import { fetchCenterSettings, updateCenterSettings } from '../../services/adminService';
import { useAuth } from '../../contexts/AuthContext';

export const AdminSettingsManager: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [settings, setSettings] = useState<CenterSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await fetchCenterSettings();
      setSettings(data);
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings || !currentUser) return;
    setSaving(true);
    setSavedSuccess(false);

    try {
      await updateCenterSettings(settings, {
        uid: currentUser.uid,
        email: currentUser.email,
        role: currentUser.role
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (err: any) {
      alert(`Error saving settings: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) {
    return (
      <div className="py-20 text-center text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-[#0F294A]" />
        <p className="text-xs">Loading center configuration parameters...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Settings className="w-5 h-5 text-slate-700" />
            Center Operational Configuration & Settings
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Global center profile, service timings, home collection coverage, emergency phone, and notices.
          </p>
        </div>

        {savedSuccess && (
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Settings saved and logged to audit trail!
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Center Identity & Contact */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-3">
            <MapPin className="w-4 h-4 text-emerald-700" />
            Center Identification & Contact Info
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Diagnostic Center Name</label>
              <input
                type="text"
                required
                value={settings.centerName}
                onChange={(e) => setSettings({ ...settings, centerName: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Official Tagline</label>
              <input
                type="text"
                value={settings.tagline}
                onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">Physical Address</label>
              <input
                type="text"
                required
                value={settings.address}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Primary Helpdesk Phone</label>
              <input
                type="text"
                required
                value={settings.phone}
                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Emergency Phlebotomy Helpline</label>
              <input
                type="text"
                required
                value={settings.emergencyPhone}
                onChange={(e) => setSettings({ ...settings, emergencyPhone: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Official Email Address</label>
              <input
                type="email"
                required
                value={settings.email}
                onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Center Pin Code</label>
              <input
                type="text"
                required
                value={settings.pincode}
                onChange={(e) => setSettings({ ...settings, pincode: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Business Operating Hours */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-3">
            <Clock className="w-4 h-4 text-blue-600" />
            Operating & Specimen Intake Timings
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Monday to Saturday Timings</label>
              <input
                type="text"
                required
                value={settings.timingsWeekday}
                onChange={(e) => setSettings({ ...settings, timingsWeekday: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Sunday & Holiday Timings</label>
              <input
                type="text"
                required
                value={settings.timingsSunday}
                onChange={(e) => setSettings({ ...settings, timingsSunday: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Home Collection Configuration */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-3">
            <Home className="w-4 h-4 text-emerald-700" />
            Home Sample Collection Service Parameters
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="sm:col-span-2 flex items-center gap-2">
              <input
                type="checkbox"
                id="enable_home_collection"
                checked={settings.enableHomeCollection}
                onChange={(e) => setSettings({ ...settings, enableHomeCollection: e.target.checked })}
                className="w-4 h-4 text-emerald-600 rounded border-slate-300"
              />
              <label htmlFor="enable_home_collection" className="font-bold text-slate-800">
                Enable Home Sample Collection Booking on Portal
              </label>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Serviced Jaipur Pincodes (comma separated)</label>
              <input
                type="text"
                value={settings.homeCollectionPincodes}
                onChange={(e) => setSettings({ ...settings, homeCollectionPincodes: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">e.g. 302033 (Pratap Nagar), 302029 (Sanganer)</span>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Minimum Advance Notice (Hours)</label>
              <input
                type="number"
                min={1}
                max={24}
                value={settings.homeCollectionNoticeHours}
                onChange={(e) => setSettings({ ...settings, homeCollectionNoticeHours: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Public Notice Banner */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-3">
            <Bell className="w-4 h-4 text-amber-600" />
            Center Public Notices & Announcements
          </h3>

          <div className="text-xs">
            <label className="block font-bold text-slate-700 mb-1">Notice Text (Displayed to Patients)</label>
            <textarea
              rows={2}
              value={settings.operationalNotice || ''}
              onChange={(e) => setSettings({ ...settings, operationalNotice: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white leading-relaxed"
            />
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="bg-[#0F294A] hover:bg-[#16365D] text-white font-bold text-xs px-6 py-2.5 rounded-xl flex items-center gap-2 shadow-xs transition-colors"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Settings & Log Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};
