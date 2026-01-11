'use client';

import React, { useState, useEffect } from 'react';
import { Edit, Trash2, Power, Shield, UserPlus, X, Check, Search, Lock, Mail, User, ShieldCheck, Settings } from 'lucide-react';

const AdminManagement = () => {
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'admin' // Default role
  });
  const [editFormData, setEditFormData] = useState({
    id: '',
    username: '',
    email: '',
    role: 'admin'
  });

  // Helper function to sort admins with superadmins first
  const sortAdmins = (admins) => {
    return [...admins].sort((a, b) => {
      if (a.role === 'superadmin' && b.role !== 'superadmin') return -1;
      if (a.role !== 'superadmin' && b.role === 'superadmin') return 1;
      return 0;
    });
  };
  const [admins, setAdmins] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingAdmins, setLoadingAdmins] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [adminToDelete, setAdminToDelete] = useState(null);
  const [showAdminPermissionsModal, setShowAdminPermissionsModal] = useState(false);
  const [showSupportPermissionsModal, setShowSupportPermissionsModal] = useState(false);

  const [adminModules, setAdminModules] = useState(() => {
    return [
      { id: 'dashboard', label: 'Dashboard', enabled: true },
      { id: 'admin-management', label: 'Admin Management', enabled: true },
      { id: 'vendors-management', label: 'Vendors Management', enabled: true },
      { id: 'category', label: 'Category', enabled: true },
      { id: 'test-management', label: 'Test Management', enabled: true },
      { id: 'packages', label: 'Packages', enabled: true },
      { id: 'coupons', label: 'Coupons & Offers', enabled: true },
      { id: 'advertisements', label: 'Advertisements', enabled: true },
      { id: 'analytics', label: 'Analytics & Reports', enabled: true },
      { id: 'support', label: 'Support', enabled: true }
    ];
  });

  const [supportModules, setSupportModules] = useState(() => {
    return [
      { id: 'dashboard', label: 'Dashboard', enabled: true },
      { id: 'admin-management', label: 'Admin Management', enabled: true },
      { id: 'vendors-management', label: 'Vendors Management', enabled: true },
      { id: 'category', label: 'Category', enabled: true },
      { id: 'test-management', label: 'Test Management', enabled: true },
      { id: 'packages', label: 'Packages', enabled: true },
      { id: 'coupons', label: 'Coupons & Offers', enabled: true },
      { id: 'advertisements', label: 'Advertisements', enabled: true },
      { id: 'analytics', label: 'Analytics & Reports', enabled: true },
      { id: 'support', label: 'Support', enabled: true }
    ];
  });

  // Fetch admins from the database
  useEffect(() => {
    const fetchAdmins = async () => {
      try {
        setLoadingAdmins(true);
        const response = await fetch('/api/admins');
        const data = await response.json();
        if (response.ok && data.success) {
          setAdmins(sortAdmins(data.admins));
        } else {
          console.error('Failed to fetch admins:', data.message);
        }
      } catch (err) {
        console.error('Failed to fetch admins:', err);
      } finally {
        setLoadingAdmins(false);
      }
    };

    fetchAdmins();
  }, []);

  // Fetch module permissions from the database
  useEffect(() => {
    const fetchModulePermissions = async () => {
      try {
        const response = await fetch('/api/admin-module-permissions');
        const data = await response.json();

        if (response.ok && data.success) {
          const adminModulesWithEnabled = data.data.adminModules.map(module => ({
            id: module.id || module._id || '',
            label: module.label || 'Unknown Module',
            enabled: module.enabled !== undefined ? module.enabled : true
          })).filter(module => module.id);

          const supportModulesWithEnabled = data.data.supportModules.map(module => ({
            id: module.id || module._id || '',
            label: module.label || 'Unknown Module',
            enabled: module.enabled !== undefined ? module.enabled : true
          })).filter(module => module.id);

          if (adminModulesWithEnabled.length > 0) setAdminModules(adminModulesWithEnabled);
          if (supportModulesWithEnabled.length > 0) setSupportModules(supportModulesWithEnabled);

          localStorage.setItem('adminModules', JSON.stringify(adminModulesWithEnabled));
          localStorage.setItem('supportModules', JSON.stringify(supportModulesWithEnabled));
        }
      } catch (err) {
        console.error('Failed to fetch permissions', err);
      }
    };

    fetchModulePermissions();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/admin/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          role: formData.role
        }),
      });

      const result = await response.json();

      if (!response.ok) throw new Error(result.message || 'Registration failed');

      const refreshResponse = await fetch('/api/admins');
      const refreshData = await refreshResponse.json();
      if (refreshResponse.ok && refreshData.success) {
        setAdmins(sortAdmins(refreshData.admins));
      }

      setSuccess(true);
      setFormData({ username: '', email: '', password: '', confirmPassword: '', role: 'admin' });
      setTimeout(() => { setShowRegistrationForm(false); setSuccess(false); }, 2000);
    } catch (err) {
      setError(err.message || 'An error occurred during registration');
    } finally {
      setLoading(false);
    }
  };

  const handleEditFormSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/admins', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editFormData.id,
          username: editFormData.username,
          email: editFormData.email,
          role: editFormData.role
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Update failed');

      const refreshResponse = await fetch('/api/admins');
      const refreshData = await refreshResponse.json();
      if (refreshResponse.ok && refreshData.success) {
        setAdmins(sortAdmins(refreshData.admins));
      }

      setSuccess(true);
      setTimeout(() => { setShowEditForm(false); setSuccess(false); }, 2000);
    } catch (err) {
      setError(err.message || 'An error occurred during update');
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (admin) => {
    setEditFormData({
      id: admin.id,
      username: admin.username,
      email: admin.email,
      role: admin.role
    });
    setShowEditForm(true);
  };

  const openDeleteModal = (admin) => {
    setAdminToDelete(admin);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      const response = await fetch(`/api/admins?id=${adminToDelete.id}`, { method: 'DELETE' });
      const result = await response.json();

      if (result.success) {
        const refreshResponse = await fetch('/api/admins');
        const refreshData = await refreshResponse.json();
        if (refreshResponse.ok && refreshData.success) {
          setAdmins(sortAdmins(refreshData.admins));
        }
        setShowDeleteModal(false);
        setAdminToDelete(null);
      } else {
        setError(result.message || 'Failed to delete admin');
      }
    } catch (err) {
      setError(err.message || 'An error occurred during deletion');
    }
  };

  const handleDeactivate = async (admin) => {
    try {
      const newStatus = admin.status === 'active' ? 'inactive' : 'active';
      const response = await fetch('/api/admins', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: admin.id, status: newStatus }),
      });

      const result = await response.json();

      if (result.success) {
        const refreshResponse = await fetch('/api/admins');
        const refreshData = await refreshResponse.json();
        if (refreshResponse.ok && refreshData.success) {
          setAdmins(sortAdmins(refreshData.admins));
        }
      } else {
        setError(result.message || 'Failed to update admin status');
      }
    } catch (err) {
      setError(err.message || 'An error occurred during status update');
    }
  };

  const toggleAdminModule = (moduleId) => {
    setAdminModules(prevModules => {
      const updatedModules = prevModules.map(module =>
        module.id === moduleId ? { ...module, enabled: !module.enabled } : module
      );
      if (!updatedModules.some(m => m.id === 'support')) {
        updatedModules.push({ id: 'support', label: 'Support', enabled: true });
      }
      saveModulesToDatabase('admin', updatedModules);
      localStorage.setItem('adminModules', JSON.stringify(updatedModules));
      if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('adminModulesUpdated', { detail: { modules: updatedModules } }));
      return updatedModules;
    });
  };

  const toggleSupportModule = (moduleId) => {
    setSupportModules(prevModules => {
      const updatedModules = prevModules.map(module =>
        module.id === moduleId ? { ...module, enabled: !module.enabled } : module
      );
      if (!updatedModules.some(m => m.id === 'admin-management')) {
        updatedModules.push({ id: 'admin-management', label: 'Admin Management', enabled: true });
      }
      saveModulesToDatabase('support', updatedModules);
      localStorage.setItem('supportModules', JSON.stringify(updatedModules));
      if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('supportModulesUpdated', { detail: { modules: updatedModules } }));
      return updatedModules;
    });
  };

  const saveModulesToDatabase = async (role, modules) => {
    try {
      await fetch('/api/admin-module-permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, modules }),
      });
    } catch (error) { console.error('Error saving module permissions:', error); }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2 border-b border-slate-200/60">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-blue-600" />
            Admin & Roles
          </h1>
          <p className="text-slate-500 mt-2 text-sm font-medium">Manage team access, roles, and platform permissions.</p>
        </div>
        <button
          onClick={() => setShowRegistrationForm(true)}
          className="group flex items-center gap-2 bg-[#0052FF] hover:bg-blue-600 text-white px-6 py-3 rounded-2xl shadow-lg shadow-blue-500/25 transition-all duration-300 hover:scale-[1.02]"
        >
          <div className="bg-white/20 p-1 rounded-lg">
            <UserPlus className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold tracking-wide text-sm">Create Admin</span>
        </button>
      </div>

      {/* Floating Permission Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Admin Permissions Card */}
        <div
          onClick={() => setShowAdminPermissionsModal(true)}
          className="group relative bg-white border border-slate-100 rounded-[32px] p-8 cursor-pointer overflow-hidden transition-all duration-300 hover:shadow-[0_20px_40px_-15px_rgba(0,82,255,0.15)] hover:border-blue-100"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -mr-20 -mt-20"></div>

          <div className="flex items-start justify-between relative z-10">
            <div>
              <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-sm border border-blue-100">
                <Shield className="w-7 h-7" strokeWidth={2} />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-2">Admin Configuration</h3>
              <p className="text-slate-500 text-sm font-medium max-w-xs">Full access control. Manage visible modules for all administrators.</p>
            </div>
            <div className="bg-slate-50 p-2 rounded-full -mr-2 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
              <Settings className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Support Permissions Card */}
        <div
          onClick={() => setShowSupportPermissionsModal(true)}
          className="group relative bg-white border border-slate-100 rounded-[32px] p-8 cursor-pointer overflow-hidden transition-all duration-300 hover:shadow-[0_20px_40px_-15px_rgba(16,185,129,0.15)] hover:border-emerald-100"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -mr-20 -mt-20"></div>

          <div className="flex items-start justify-between relative z-10">
            <div>
              <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-sm border border-emerald-100">
                <User className="w-7 h-7" strokeWidth={2} />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-2">Support Configuration</h3>
              <p className="text-slate-500 text-sm font-medium max-w-xs">Limited access control. Define tools available for support staff.</p>
            </div>
            <div className="bg-slate-50 p-2 rounded-full -mr-2 group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300">
              <Settings className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Floating Rows Table for Admins */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-400 uppercase tracking-widest pl-2 mb-4">Team Members</h2>

        {loadingAdmins ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
          </div>
        ) : admins.length > 0 ? (
          <div className="flex flex-col gap-4">
            {admins.map((admin) => (
              <div
                key={admin.id}
                className="group flex flex-col md:flex-row md:items-center justify-between bg-white p-5 rounded-[20px] border border-slate-100 hover:border-blue-100 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.02)] hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-300"
              >
                {/* User Profile Info */}
                <div className="flex items-center gap-4 min-w-[30%]">
                  <div className={`w-12 h-12 rounded-[18px] flex items-center justify-center text-lg font-extrabold ${admin.role === 'superadmin' ? 'bg-purple-50 text-purple-600' :
                      admin.role === 'admin' ? 'bg-blue-50 text-blue-600' :
                        'bg-emerald-50 text-emerald-600'
                    }`}>
                    {admin.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-800">{admin.username}</h4>
                    <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                      <Mail className="w-3 h-3" />
                      {admin.email}
                    </div>
                  </div>
                </div>

                {/* Role Badge */}
                <div className="flex items-center gap-2 min-w-[20%] mt-4 md:mt-0">
                  <span className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-wide uppercase ${admin.role === 'superadmin' ? 'bg-purple-100 text-purple-700' :
                      admin.role === 'admin' ? 'bg-blue-100 text-blue-700' :
                        'bg-emerald-100 text-emerald-700'
                    }`}>
                    {admin.role}
                  </span>
                </div>

                {/* Status & Date */}
                <div className="flex items-center gap-8 min-w-[25%] mt-4 md:mt-0">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${admin.status === 'active' ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`}></div>
                    <span className="text-sm font-semibold text-slate-600 capitalize">{admin.status}</span>
                  </div>
                  <div className="text-xs font-medium text-slate-400 hidden lg:block">
                    Added: {new Date(admin.createdAt).toLocaleDateString()}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 justify-end mt-4 md:mt-0 min-w-[15%]">
                  {admin.role === 'superadmin' ? (
                    <span className="text-xs font-bold text-slate-300 bg-slate-50 px-3 py-1 rounded-lg">Master Account</span>
                  ) : (
                    <>
                      <button onClick={() => openEditModal(admin)} className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all" title="Edit Profile">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDeactivate(admin)} className={`p-2.5 rounded-xl transition-all ${admin.status === 'active' ? 'text-slate-400 hover:text-orange-500 hover:bg-orange-50' : 'text-slate-400 hover:text-green-600 hover:bg-green-50'}`} title="Suspend/Activate">
                        <Power className="w-4 h-4" />
                      </button>
                      <button onClick={() => openDeleteModal(admin)} className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all" title="Delete Profile">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-[32px] border border-slate-100 border-dashed">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-slate-400 font-medium">No administrators found.</p>
          </div>
        )}
      </div>

      {/* Modals remain mostly functionally same but with maintained style updates from previous step */}
      {/* Registration Form Modal */}
      {showRegistrationForm && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-white/20 ring-1 ring-black/5">
            <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-800">New Administrator</h3>
              <button
                onClick={() => setShowRegistrationForm(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-2 hover:bg-slate-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-8">
              <form onSubmit={handleFormSubmit} className="space-y-5">
                {error && <div className="rounded-xl bg-red-50 p-3 text-xs font-bold text-red-600 text-center">{error}</div>}

                <div className="space-y-4">
                  <input type="text" name="username" required value={formData.username} onChange={handleInputChange} className="w-full px-5 py-3 text-sm font-medium bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all placeholder:text-slate-400" placeholder="Username" />
                  <input type="email" name="email" required value={formData.email} onChange={handleInputChange} className="w-full px-5 py-3 text-sm font-medium bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all placeholder:text-slate-400" placeholder="Email Address" />
                  <select name="role" value={formData.role} onChange={handleInputChange} className="w-full px-5 py-3 text-sm font-medium bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all text-slate-600">
                    <option value="superadmin">Super Admin</option>
                    <option value="admin">Admin</option>
                    <option value="support">Support</option>
                  </select>
                  <input type="password" name="password" required value={formData.password} onChange={handleInputChange} className="w-full px-5 py-3 text-sm font-medium bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all placeholder:text-slate-400" placeholder="Password" />
                  <input type="password" name="confirmPassword" required value={formData.confirmPassword} onChange={handleInputChange} className="w-full px-5 py-3 text-sm font-medium bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all placeholder:text-slate-400" placeholder="Confirm Password" />
                </div>

                <div className="pt-2">
                  <button type="submit" disabled={loading} className="w-full py-3.5 text-sm font-bold text-white bg-[#0052FF] hover:bg-blue-600 rounded-2xl shadow-lg shadow-blue-500/20 transition-all transform active:scale-95">
                    {loading ? 'Creating Account...' : 'Create Account'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditForm && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-white/20 ring-1 ring-black/5">
            <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-800">Edit Profile</h3>
              <button
                onClick={() => setShowEditForm(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-2 hover:bg-slate-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-8">
              <form onSubmit={handleEditFormSubmit} className="space-y-5">
                {error && <div className="rounded-xl bg-red-50 p-3 text-xs font-bold text-red-600 text-center">{error}</div>}

                <div className="space-y-4">
                  <input type="text" name="username" required value={editFormData.username} onChange={handleEditInputChange} className="w-full px-5 py-3 text-sm font-medium bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all placeholder:text-slate-400" placeholder="Username" />
                  <input type="email" name="email" required value={editFormData.email} onChange={handleEditInputChange} className="w-full px-5 py-3 text-sm font-medium bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all placeholder:text-slate-400" placeholder="Email Address" />
                  <select name="role" value={editFormData.role} onChange={handleEditInputChange} className="w-full px-5 py-3 text-sm font-medium bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all text-slate-600">
                    <option value="superadmin">Super Admin</option>
                    <option value="admin">Admin</option>
                    <option value="support">Support</option>
                  </select>
                </div>

                <div className="pt-2">
                  <button type="submit" disabled={loading} className="w-full py-3.5 text-sm font-bold text-white bg-[#0052FF] hover:bg-blue-600 rounded-2xl shadow-lg shadow-blue-500/20 transition-all transform active:scale-95">
                    {loading ? 'Saving Changes...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Permission Modals (Reused with updated backdrop) */}
      {showAdminPermissionsModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden ring-1 ring-black/5">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
              <div>
                <h3 className="text-xl font-extrabold text-slate-800">Admin Modules</h3>
                <p className="text-sm text-slate-500 mt-1">Configure which features are visible to Admin users.</p>
              </div>
              <button onClick={() => setShowAdminPermissionsModal(false)} className="bg-slate-100 p-2 rounded-full hover:bg-slate-200 transition-colors"><X className="w-5 h-5 text-slate-500" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {adminModules.map((module) => (
                  <div key={module.id} className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-white hover:border-blue-200 hover:shadow-md transition-all">
                    <span className="font-bold text-slate-700 text-sm">{module.label}</span>
                    <button onClick={() => toggleAdminModule(module.id)} className={`w-12 h-6 rounded-full relative transition-colors ${module.enabled ? 'bg-blue-600' : 'bg-slate-200'}`}>
                      <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${module.enabled ? 'translate-x-6' : 'translate-x-0'}`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {showSupportPermissionsModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden ring-1 ring-black/5">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
              <div>
                <h3 className="text-xl font-extrabold text-slate-800">Support Modules</h3>
                <p className="text-sm text-slate-500 mt-1">Configure which features are visible to Support users.</p>
              </div>
              <button onClick={() => setShowSupportPermissionsModal(false)} className="bg-slate-100 p-2 rounded-full hover:bg-slate-200 transition-colors"><X className="w-5 h-5 text-slate-500" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {supportModules.map((module) => (
                  <div key={module.id} className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-white hover:border-emerald-200 hover:shadow-md transition-all">
                    <span className="font-bold text-slate-700 text-sm">{module.label}</span>
                    <button onClick={() => toggleSupportModule(module.id)} className={`w-12 h-6 rounded-full relative transition-colors ${module.enabled ? 'bg-emerald-500' : 'bg-slate-200'}`}>
                      <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${module.enabled ? 'translate-x-6' : 'translate-x-0'}`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-8 max-w-sm text-center shadow-2xl">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Trash2 className="w-10 h-10 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Delete Account?</h3>
            <p className="text-slate-500 text-sm mb-8">This will permanently remove <strong>{adminToDelete?.username}</strong> from the system.</p>
            <div className="flex gap-4">
              <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-3 text-sm font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">Cancel</button>
              <button onClick={confirmDelete} className="flex-1 py-3 text-sm font-bold text-white bg-red-500 hover:bg-red-600 rounded-xl shadow-lg shadow-red-500/30 transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminManagement;