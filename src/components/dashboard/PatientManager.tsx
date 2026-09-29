import React, { useState, useEffect } from 'react';
import {
  PatientRecord,
  PatientGender,
  PatientRelation,
} from '../../types/bookingSystem';
import {
  getPatientsForUser,
  createPatientRecord,
  updatePatientRecord,
  archivePatientRecord,
} from '../../services/patientService';
import { useAuth } from '../../contexts/AuthContext';
import {
  UserPlus,
  Edit2,
  Trash2,
  Check,
  User,
  Phone,
  AlertCircle,
  X,
} from 'lucide-react';
import {
  Button,
  SkeletonList,
  EmptyState,
  ConfirmDialog,
} from '../ui/DesignSystem';

interface PatientManagerProps {
  onSelectPatient?: (patient: PatientRecord) => void;
  selectedPatientId?: string;
  isSelectionMode?: boolean;
}

export const PatientManager: React.FC<PatientManagerProps> = ({
  onSelectPatient,
  selectedPatientId,
  isSelectionMode = false,
}) => {
  const { user } = useAuth();
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPatient, setEditingPatient] = useState<PatientRecord | null>(null);
  const [patientToDelete, setPatientToDelete] = useState<PatientRecord | null>(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState<number>(30);
  const [gender, setGender] = useState<PatientGender>('Male');
  const [relation, setRelation] = useState<PatientRelation>('Self');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

  const loadPatients = async () => {
    if (!user) return;
    setLoading(true);
    const list = await getPatientsForUser(user.uid);
    setPatients(list);
    setLoading(false);
  };

  useEffect(() => {
    loadPatients();
  }, [user]);

  const resetForm = () => {
    setFullName('');
    setAge(30);
    setGender('Male');
    setRelation('Self');
    setPhone(user?.phone || '');
    setAddress('');
    setNotes('');
    setEditingPatient(null);
    setError('');
  };

  const handleOpenAdd = () => {
    resetForm();
    setShowForm(true);
  };

  const handleOpenEdit = (patient: PatientRecord) => {
    setEditingPatient(patient);
    setFullName(patient.full_name);
    setAge(patient.age);
    setGender(patient.gender);
    setRelation(patient.relation);
    setPhone(patient.phone || '');
    setAddress(patient.address || '');
    setNotes(patient.notes || '');
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError('');
    setSubmitting(true);

    try {
      if (editingPatient) {
        await updatePatientRecord(editingPatient.patient_id, user.uid, {
          full_name: fullName,
          age,
          gender,
          relation,
          phone,
          address,
          notes,
        });
      } else {
        const created = await createPatientRecord({
          userId: user.uid,
          fullName,
          age,
          gender,
          relation,
          phone,
          address,
          notes,
        });
        if (onSelectPatient) {
          onSelectPatient(created);
        }
      }
      setShowForm(false);
      resetForm();
      await loadPatients();
    } catch (err: any) {
      setError(err.message || 'Failed to save patient profile.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!user || !patientToDelete) return;
    try {
      await archivePatientRecord(patientToDelete.patient_id, user.uid);
      setPatientToDelete(null);
      await loadPatients();
    } catch (err: any) {
      setError(err.message || 'Could not archive patient profile.');
      setPatientToDelete(null);
    }
  };

  if (loading) {
    return <SkeletonList rows={3} />;
  }

  return (
    <div className="space-y-5">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-[#0F294A]">
            {isSelectionMode ? 'Step 2: Select Patient Profile' : 'Patient Profiles'}
          </h2>
          <p className="text-xs text-slate-600">
            {isSelectionMode
              ? 'Choose who this diagnostic test is being booked for, or add a new patient.'
              : 'Manage patient profiles for yourself and your family members.'}
          </p>
        </div>

        {!showForm && (
          <Button variant="secondary" size="sm" onClick={handleOpenAdd}>
            <UserPlus className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Add Patient</span>
          </Button>
        )}
      </div>

      {error && (
        <div
          role="alert"
          className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2"
        >
          <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      {/* Add / Edit Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4"
        >
          <div className="flex justify-between items-center border-b border-slate-200 pb-3">
            <h3 className="text-sm font-bold text-[#0F294A]">
              {editingPatient ? 'Edit Patient Profile' : 'Add New Patient Profile'}
            </h3>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                resetForm();
              }}
              className="text-slate-400 hover:text-slate-700 p-1 rounded cursor-pointer"
              aria-label="Close patient form"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="patient-fullname"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Patient Full Name <span className="text-red-600">*</span>
              </label>
              <input
                id="patient-fullname"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter full name"
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0F294A]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="patient-age"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Age (Years) <span className="text-red-600">*</span>
                </label>
                <input
                  id="patient-age"
                  type="number"
                  min={0}
                  max={120}
                  required
                  value={age}
                  onChange={(e) => setAge(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0F294A] tabular-nums"
                />
              </div>

              <div>
                <label
                  htmlFor="patient-gender"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Gender <span className="text-red-600">*</span>
                </label>
                <select
                  id="patient-gender"
                  value={gender}
                  onChange={(e) => setGender(e.target.value as PatientGender)}
                  className="w-full px-3 py-2.5 text-xs sm:text-sm rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0F294A]"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label
                htmlFor="patient-relation"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Relation <span className="text-red-600">*</span>
              </label>
              <select
                id="patient-relation"
                value={relation}
                onChange={(e) => setRelation(e.target.value as PatientRelation)}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0F294A]"
              >
                <option value="Self">Self</option>
                <option value="Spouse">Spouse</option>
                <option value="Father">Father</option>
                <option value="Mother">Mother</option>
                <option value="Child">Child</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="patient-phone"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Phone Number (10 digits)
              </label>
              <input
                id="patient-phone"
                type="tel"
                maxLength={10}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                placeholder="9876543210"
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0F294A] tabular-nums"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setShowForm(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={submitting}>
              {editingPatient ? 'Save Changes' : 'Save Patient'}
            </Button>
          </div>
        </form>
      )}

      {/* Patient Cards List */}
      {patients.length === 0 ? (
        <EmptyState
          title="No Patient Profiles Saved"
          description="Add a patient profile for yourself or a family member to book diagnostic tests."
          actionText="Add First Patient"
          onAction={handleOpenAdd}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {patients.map((p) => {
            const isSelected = selectedPatientId === p.patient_id;
            return (
              <div
                key={p.patient_id}
                onClick={() => {
                  if (isSelectionMode && onSelectPatient) {
                    onSelectPatient(p);
                  }
                }}
                className={`p-5 rounded-xl border transition-all flex flex-col justify-between gap-4 ${
                  isSelectionMode ? 'cursor-pointer' : ''
                } ${
                  isSelected
                    ? 'bg-emerald-50/60 border-[#059669] ring-1 ring-[#059669]'
                    : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 font-bold text-sm ${
                        isSelected
                          ? 'bg-[#059669] text-white'
                          : 'bg-slate-100 text-[#0F294A]'
                      }`}
                    >
                      {isSelected ? (
                        <Check className="w-5 h-5" aria-hidden="true" />
                      ) : (
                        <User className="w-5 h-5" aria-hidden="true" />
                      )}
                    </div>

                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-bold text-slate-900">
                          {p.full_name}
                        </h3>
                        <span className="text-[11px] font-semibold text-[#0F294A] bg-slate-100 px-2 py-0.5 rounded">
                          {p.relation}
                        </span>
                      </div>

                      <p className="text-slate-600 font-medium">
                        Age: <strong className="text-slate-800">{p.age} Yrs</strong> · Gender:{' '}
                        <strong className="text-slate-800">{p.gender}</strong>
                      </p>

                      {p.phone && (
                        <p className="text-slate-500 flex items-center gap-1 tabular-nums">
                          <Phone className="w-3 h-3 text-emerald-600" aria-hidden="true" />
                          <span>+91 {p.phone}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions: Select Patient for Booking, Edit Patient, Archive/Delete */}
                <div
                  className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  {isSelectionMode && onSelectPatient ? (
                    <Button
                      variant={isSelected ? 'secondary' : 'primary'}
                      size="sm"
                      onClick={() => onSelectPatient(p)}
                    >
                      {isSelected ? 'Selected for Booking' : 'Select Patient'}
                    </Button>
                  ) : (
                    <span className="text-[11px] font-mono text-slate-400">
                      {p.patient_id}
                    </span>
                  )}

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(p)}
                      className="px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-[#0F294A] hover:bg-slate-100 rounded-lg flex items-center gap-1 cursor-pointer"
                      aria-label={`Edit ${p.full_name}`}
                    >
                      <Edit2 className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Edit</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPatientToDelete(p)}
                      className="px-2.5 py-1.5 text-xs font-semibold text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-1 cursor-pointer"
                      aria-label={`Archive ${p.full_name}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Archive</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirmation Dialog for Archive/Delete */}
      <ConfirmDialog
        isOpen={Boolean(patientToDelete)}
        title="Archive Patient Profile?"
        description={`Are you sure you want to archive ${patientToDelete?.full_name}? Past bookings for this patient will remain safe in your booking history.`}
        confirmLabel="Archive Profile"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setPatientToDelete(null)}
      />
    </div>
  );
};
