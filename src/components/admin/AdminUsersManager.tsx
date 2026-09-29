import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  ShieldCheck, 
  Shield, 
  UserX, 
  UserCheck, 
  RefreshCw, 
  Calendar, 
  Mail, 
  Phone,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { AdminUserListItem } from '../../types/admin';
import { UserRole } from '../../types/auth';
import { fetchAdminUsers, updateUserRole, toggleUserStatus } from '../../services/adminService';
import { useAuth } from '../../contexts/AuthContext';

export const AdminUsersManager: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<AdminUserListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<AdminUserListItem | null>(null);
  const [modalAction, setModalAction] = useState<'ROLE' | 'STATUS' | null>(null);
  const [newRoleSelect, setNewRoleSelect] = useState<UserRole>('USER');

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await fetchAdminUsers();
      setUsers(data);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = users.filter(u => {
    const q = search.toLowerCase();
    const matchesSearch = 
      u.displayName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.phone.includes(q) ||
      u.uid.toLowerCase().includes(q);

    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    const matchesStatus = 
      statusFilter === 'ALL' || 
      (statusFilter === 'ACTIVE' && u.isActive) ||
      (statusFilter === 'INACTIVE' && !u.isActive);

    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleRoleChangeConfirm = async () => {
    if (!selectedUser || !currentUser) return;
    setUpdatingId(selectedUser.uid);
    try {
      await updateUserRole(selectedUser.uid, newRoleSelect, {
        uid: currentUser.uid,
        email: currentUser.email,
        role: currentUser.role
      });
      setUsers(prev => prev.map(u => u.uid === selectedUser.uid ? { ...u, role: newRoleSelect } : u));
      setModalAction(null);
      setSelectedUser(null);
    } catch (err: any) {
      alert(`Error updating role: ${err.message}`);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleToggleStatus = async (user: AdminUserListItem) => {
    if (!currentUser) return;
    const targetStatus = !user.isActive;
    const confirmMessage = targetStatus
      ? `Re-activate account for ${user.displayName} (${user.email})?`
      : `Deactivate account for ${user.displayName} (${user.email})? They will not be able to log in or book.`;

    if (!window.confirm(confirmMessage)) return;

    setUpdatingId(user.uid);
    try {
      await toggleUserStatus(user.uid, targetStatus, {
        uid: currentUser.uid,
        email: currentUser.email,
        role: currentUser.role
      });
      setUsers(prev => prev.map(u => u.uid === user.uid ? { ...u, isActive: targetStatus } : u));
    } catch (err: any) {
      alert(`Error updating user status: ${err.message}`);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            User Account & Access Management
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Server-side authorization management. Manage roles (USER, STAFF, ADMIN), review registered patients, and toggle account activation.
          </p>
        </div>

        <button
          onClick={loadUsers}
          disabled={loading}
          className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Users
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email, phone, or UID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-blue-600 bg-white"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-700 focus:outline-hidden"
          >
            <option value="ALL">All Roles</option>
            <option value="USER">USER</option>
            <option value="STAFF">STAFF</option>
            <option value="ADMIN">ADMIN</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-700 focus:outline-hidden"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active Only</option>
            <option value="INACTIVE">Deactivated Only</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-3.5">User</th>
                <th className="px-4 py-3.5">Contact</th>
                <th className="px-4 py-3.5">Role</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-center">Patients</th>
                <th className="px-4 py-3.5 text-center">Bookings</th>
                <th className="px-4 py-3.5">Registered</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                    Loading user accounts...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No matching users found.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isSuperAdmin =
                    u.phone === '+919649183422' ||
                    u.phone === '9649183422' ||
                    u.email === 'bldiagnosticcentre@gmail.com';
                  return (
                    <tr key={u.uid} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-900">{u.displayName}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5 truncate max-w-[140px]" title={u.uid}>
                          {u.uid}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 space-y-0.5">
                        {u.phone && u.phone !== 'N/A' && (
                          <div className="flex items-center gap-1.5 text-slate-800 font-semibold text-xs tabular-nums">
                            <Phone className="w-3 h-3 text-emerald-600 shrink-0" />
                            <span>{u.phone.startsWith('+91') ? u.phone : `+91 ${u.phone}`}</span>
                          </div>
                        )}
                        {u.email && (
                          <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                            <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{u.email}</span>
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3.5">
                        <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] inline-flex items-center gap-1 ${
                          u.role === 'ADMIN'
                            ? 'bg-purple-100 text-purple-800'
                            : u.role === 'STAFF'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {u.role === 'ADMIN' && <Shield className="w-3 h-3" />}
                          {u.role === 'STAFF' && <ShieldCheck className="w-3 h-3" />}
                          {u.role}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          u.isActive
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {u.isActive ? 'Active' : 'Deactivated'}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-center font-bold text-slate-800">
                        {u.patientsCount ?? 0}
                      </td>

                      <td className="px-4 py-3.5 text-center font-bold text-slate-800">
                        {u.bookingsCount ?? 0}
                      </td>

                      <td className="px-4 py-3.5 text-slate-500 whitespace-nowrap">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>

                      <td className="px-4 py-3.5 text-right space-x-1 whitespace-nowrap">
                        {/* Role Change Button */}
                        <button
                          disabled={isSuperAdmin || updatingId === u.uid}
                          onClick={() => {
                            setSelectedUser(u);
                            setNewRoleSelect(u.role);
                            setModalAction('ROLE');
                          }}
                          className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:opacity-40 transition-colors"
                          title="Change user role"
                        >
                          Role
                        </button>

                        {/* Toggle Status Button */}
                        <button
                          disabled={isSuperAdmin || updatingId === u.uid}
                          onClick={() => handleToggleStatus(u)}
                          className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-colors disabled:opacity-40 ${
                            u.isActive
                              ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          }`}
                          title={u.isActive ? 'Deactivate account' : 'Reactivate account'}
                        >
                          {u.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Role Management Modal */}
      {modalAction === 'ROLE' && selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-slate-900">
              Change User Role: {selectedUser.displayName}
            </h3>
            <p className="text-xs text-slate-600">
              Select the new server-enforced access level for <strong>{selectedUser.email}</strong>.
            </p>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 block">Select Role</label>
              <div className="grid grid-cols-3 gap-2">
                {(['USER', 'STAFF', 'ADMIN'] as UserRole[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setNewRoleSelect(r)}
                    className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                      newRoleSelect === r
                        ? 'bg-[#0F294A] text-white border-[#0F294A] shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl text-[11px] text-slate-500 space-y-1">
              <p>• <strong>USER</strong>: standard patient booking and report download.</p>
              <p>• <strong>STAFF</strong>: phlebotomist status updates and report uploads.</p>
              <p>• <strong>ADMIN</strong>: full system access, rate edits, and user roles.</p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setModalAction(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={updatingId === selectedUser.uid}
                onClick={handleRoleChangeConfirm}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-xs"
              >
                {updatingId === selectedUser.uid ? 'Updating...' : 'Save Role Change'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
