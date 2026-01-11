"use client";
import React, { useEffect, useState } from "react";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { safeJsonParse } from '../../utils/apiUtils';
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  Mail,
  Phone,
  MapPin,
  Globe,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  Building2,
  User,
  Power
} from 'lucide-react';

export default function RolesPermission() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [viewUser, setViewUser] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    labName: '',
    ownerName: '',
    contactEmail: '',
    loginEmail: '',
    password: '',
    confirmPassword: '',
    role: 'vendor',
    phone: '',
    website: '',
    address: '',
    description: '',
    logo: null,
  });

  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newlyAddedUser, setNewlyAddedUser] = useState(null);
  const [lastRefreshTime, setLastRefreshTime] = useState(null);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedUserActivities, setSelectedUserActivities] = useState([]);
  const [newVendorsCount, setNewVendorsCount] = useState(0);
  const [selectedUserForActivity, setSelectedUserForActivity] = useState(null);
  const [selectedUserSchedules, setSelectedUserSchedules] = useState([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [showApproveRejectModal, setShowApproveRejectModal] = useState(false);
  const [showRejectReasonModal, setShowRejectReasonModal] = useState(false);
  const [vendorToProcess, setVendorToProcess] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);


  const fetchUsers = async (isFastRefresh = false) => {
    try {
      if (isFastRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const startTime = Date.now();
      const response = await fetch("/api/vendors", {
        method: "GET",
        headers: {
          "Cache-Control": "no-cache",
          "Pragma": "no-cache"
        }
      });

      if (response.ok) {
        const data = await safeJsonParse(response);
        let users = data.success && Array.isArray(data.vendors) ? data.vendors : [];

        // Filter out rejected vendors, but keep deactivated vendors
        users = users.filter(user => {
          // Keep all admin users
          if (user.role === 'admin') return true;

          // Remove rejected vendors
          if (user.approvalStatus === 'rejected') return false;

          // Keep all other users (including deactivated vendors)
          return true;
        });

        // Sort users: admin first, then regular users
        users.sort((a, b) => {
          if (a.role === 'admin' && b.role !== 'admin') return -1;
          if (a.role !== 'admin' && b.role === 'admin') return 1;
          return 0;
        });

        // Count new vendors (registered in the last 24 hours)
        const newVendors = users.filter(user => user.isNew && user.role === 'vendor');
        setNewVendorsCount(newVendors.length);

        // Show notification if there are new vendors
        if (newVendors.length > 0 && !isFastRefresh) {
          toast.info(`🎉 ${newVendors.length} new vendor${newVendors.length > 1 ? 's' : ''} registered today!`, {
            position: "top-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          });
        }

        setUsers(users);

        const duration = Date.now() - startTime;
        console.log(`✅ Users fetched in ${duration}ms (${users.length} users)`);

        if (isFastRefresh) {
          setLastRefreshTime(duration);
          toast.success(`Refreshed in ${duration}ms`);
        }
      } else {
        const errorData = await safeJsonParse(response);
        console.error('Failed to fetch users:', errorData);
        setUsers([]);
        if (isFastRefresh) {
          toast.error(`Failed to refresh users: ${errorData.error || 'Unknown error'}`);
        }
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
      if (isFastRefresh) {
        toast.error('Network error during refresh');
      }
    } finally {
      if (isFastRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  const validateForm = () => {
    const errors = {};

    // Vendor Details validation
    if (!formData.labName.trim()) {
      errors.labName = 'Lab name is required';
    } else if (formData.labName.trim().length < 3) {
      errors.labName = 'Lab name must be at least 3 characters long';
    }

    if (!formData.ownerName.trim()) {
      errors.ownerName = 'Owner name is required';
    }

    if (!formData.contactEmail.trim()) {
      errors.contactEmail = 'Contact email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail)) {
      errors.contactEmail = 'Please enter a valid email address';
    }

    if (!formData.loginEmail.trim()) {
      errors.loginEmail = 'Login email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.loginEmail)) {
      errors.loginEmail = 'Please enter a valid email address';
    }

    if (!formData.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!/^[6-9]\d{9}$/.test(formData.phone.trim())) {
      errors.phone = 'Please enter a valid 10-digit Indian phone number';
    }

    if (!formData.address.trim()) {
      errors.address = 'Address is required';
    }

    // Account Details validation
    if (!formData.username.trim()) {
      errors.username = 'Vendor name is required';
    }

    // Password validation only if password is provided
    if (formData.password || formData.confirmPassword) {
      if (formData.password.length < 6) {
        errors.password = 'Password must be at least 6 characters long';
      }

      if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddUser = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the form errors');
      return;
    }

    if (isSubmitting) return;

    try {
      setIsSubmitting(true);

      const requestData = {
        username: formData.username.trim(),
        labName: formData.labName.trim(),
        ownerName: formData.ownerName.trim(),
        contactEmail: formData.contactEmail.trim(),
        email: formData.loginEmail.trim(),
        phone: formData.phone.trim(),
        website: formData.website.trim(),
        address: formData.address.trim(),
        description: formData.description.trim(),
        logo: formData.logo ? formData.logo.name : null,
        password: formData.password,
      };

      const response = await fetch("/api/vendors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      const responseText = await response.text();
      let result = {};
      if (responseText && responseText.trim() !== '') {
        try {
          result = JSON.parse(responseText);
        } catch (parseError) {
          toast.error('Server returned invalid response.');
          return;
        }
      }

      if (response.ok) {
        const newVendor = result.vendor || result;
        toast.success(`Vendor "${newVendor.username}" created successfully!`);
        setShowAddModal(false);
        resetForm();

        setNewlyAddedUser(newVendor._id);
        setTimeout(() => setNewlyAddedUser(null), 5000);

        fetchUsers();
      } else {
        let errorMessage = 'Failed to create vendor';
        if (result && Object.keys(result).length > 0) {
          errorMessage = result.error || result.message || "Failed to create user";
        }
        toast.error(errorMessage);
      }
    } catch (error) {
      toast.error(`Network error: ${error.message}.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditUser = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the form errors");
      return;
    }

    try {
      const updates = {
        username: formData.username,
        labName: formData.labName,
        ownerName: formData.ownerName,
        contactEmail: formData.contactEmail,
        email: formData.loginEmail,
        phone: formData.phone,
        website: formData.website,
        address: formData.address,
        description: formData.description,
      };

      if (formData.password && formData.password.trim() !== '') {
        updates.password = formData.password;
      }

      const response = await fetch("/api/vendors", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          vendorId: selectedUser._id,
          updates
        }),
      });

      if (response.ok) {
        toast.success("Vendor updated successfully!");
        setShowEditModal(false);
        setSelectedUser(null);
        resetForm();
        fetchUsers();
      } else {
        const error = await safeJsonParse(response);
        toast.error(error.error || "Failed to update user");
      }
    } catch (error) {
      toast.error("Failed to update user");
    }
  };

  const handleDeleteUser = async (userId, username) => {
    setUserToDelete({ userId, username });
    setShowDeleteModal(true);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      const response = await fetch(`/api/vendors?vendorId=${userToDelete.userId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchUsers();
      } else {
        const error = await safeJsonParse(response);
        toast.error(error.error || "Failed to delete user");
      }
    } catch (error) {
      toast.error("Failed to delete user");
    } finally {
      setShowDeleteModal(false);
      setUserToDelete(null);
    }
  };

  const handleStatusChange = async (userId, newStatus, username) => {
    try {
      const response = await fetch("/api/vendors", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          vendorId: userId,
          updates: { status: newStatus }
        }),
      });

      if (response.ok) {
        const action = newStatus === 'active' ? 'activate' : 'deactivate';
        toast.success(`User "${username}" ${action}d successfully!`);
        fetchUsers();
      } else {
        const error = await safeJsonParse(response);
        toast.error(error.error || `Failed to ${newStatus === 'active' ? 'activate' : 'deactivate'} user`);
      }
    } catch (error) {
      toast.error(`Failed to ${newStatus === 'active' ? 'activate' : 'deactivate'} user`);
    }
  };

  const handleApproveVendor = async (vendor) => {
    try {
      const response = await fetch("/api/vendors/approval", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          vendorId: vendor._id,
          action: "approve"
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success(`Vendor "${vendor.labName}" approved successfully!`);
        fetchUsers();
      } else {
        const errorMessage = result.error || result.message || "Failed to approve vendor";
        toast.error(`Failed to approve vendor: ${errorMessage}`);
      }
    } catch (error) {
      toast.error(`Failed to approve vendor: ${error.message}`);
    } finally {
      setShowApproveRejectModal(false);
      setVendorToProcess(null);
    }
  };

  const handleRejectVendor = async (vendor) => {
    setVendorToProcess(vendor);
    setShowApproveRejectModal(false);
    setShowRejectReasonModal(true);
    setRejectionReason('');
  };

  const submitVendorRejection = async () => {
    if (!rejectionReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }

    try {
      const response = await fetch("/api/vendors/approval", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          vendorId: vendorToProcess._id,
          action: "reject",
          rejectionReason: rejectionReason
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success(`Vendor "${vendorToProcess.labName}" rejected and deleted!`);
        fetchUsers();
      } else {
        const errorMessage = result.error || result.message || "Failed to reject vendor";
        toast.error(`Failed to reject vendor: ${errorMessage}`);
      }
    } catch (error) {
      toast.error(`Failed to reject vendor: ${error.message}`);
    } finally {
      setShowRejectReasonModal(false);
      setVendorToProcess(null);
      setRejectionReason('');
    }
  };

  const openApproveRejectModal = (vendor) => {
    setVendorToProcess(vendor);
    setShowApproveRejectModal(true);
  };

  const openEditModal = (user) => {
    setSelectedUser(user);
    setFormData({
      username: user.username || '',
      labName: user.labName || '',
      ownerName: user.ownerName || '',
      contactEmail: user.contactEmail || '',
      loginEmail: user.email || '',
      phone: user.phone || '',
      website: user.website || '',
      address: user.address || '',
      description: user.description || '',
      logo: null,
      password: '',
      confirmPassword: '',
      role: user.role || 'vendor'
    });
    setFormErrors({});
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      username: '',
      labName: '',
      ownerName: '',
      contactEmail: '',
      loginEmail: '',
      password: '',
      confirmPassword: '',
      role: 'vendor',
      phone: '',
      website: '',
      address: '',
      description: '',
      logo: null,
      totalTestsOffered: ''
    });
    setFormErrors({});
    setSelectedUser(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2 border-b border-slate-200/60 transition-all">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <Building2 className="w-8 h-8 text-blue-600" />
            Vendor Management
          </h1>
          <p className="text-slate-500 mt-2 text-sm font-medium">Verify, manage and monitor lab partners.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="group flex items-center gap-2 bg-[#0052FF] hover:bg-blue-600 text-white px-6 py-3 rounded-2xl shadow-lg shadow-blue-500/25 transition-all duration-300 hover:scale-[1.02]"
        >
          <div className="bg-white/20 p-1 rounded-lg">
            <Plus className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold tracking-wide text-sm">New Vendor</span>
        </button>
      </div>

      {newVendorsCount > 0 && (
        <div className="bg-green-50 text-green-700 px-4 py-3 rounded-2xl flex items-center gap-3 shadow-sm border border-green-100">
          <div className="bg-green-100 p-1.5 rounded-full"><CheckCircle className="w-5 h-5" /></div>
          <span className="font-semibold">{newVendorsCount} new pending requests</span>
          <span className="text-sm opacity-80">(Check pending tab)</span>
        </div>
      )}

      {/* Vendors List Cards */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-400 uppercase tracking-widest pl-2 mb-4">All Vendors</h2>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
          </div>
        ) : users.length > 0 ? (
          <div className="flex flex-col gap-4">
            {users.map((user) => (
              <div
                key={user._id}
                className={`group flex flex-col xl:flex-row xl:items-center p-6 rounded-[24px] border transition-all duration-300 relative overflow-hidden ${user.isNew ? 'bg-green-50/30 border-green-200' : 'bg-white border-slate-100 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/5'}`}
              >
                {/* Status Indicator Bar */}
                <div className={`absolute top-0 left-0 w-1.5 h-full ${user.status === 'active' ? 'bg-green-500' : 'bg-slate-300'} opacity-0 group-hover:opacity-100 transition-opacity`}></div>

                {/* Main Info */}
                <div className="flex items-start gap-4 flex-1 min-w-[300px]">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-bold shadow-sm ${user.role === 'admin' ? 'bg-purple-100 text-purple-600' :
                      user.status === 'active' ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-400'
                    }`}>
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{user.labName || user.username}</h3>
                    <div className="flex flex-col gap-1 mt-1">
                      <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                        <User className="w-3.5 h-3.5" />
                        {user.ownerName}
                      </div>
                      <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                        <Mail className="w-3.5 h-3.5" />
                        {user.email}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contact & Status Details */}
                <div className="flex flex-col md:flex-row gap-6 xl:gap-12 mt-4 xl:mt-0 flex-[1.5]">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Phone className="w-4 h-4 text-slate-400" />
                      {user.phone || 'N/A'}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${user.approvalStatus === 'approved' ? 'bg-green-100 text-green-700' :
                        user.approvalStatus === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                      }`}>
                      {user.approvalStatus || 'Verified'}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${user.status === 'active' ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-500'
                      }`}>
                      {user.status}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 justify-end mt-4 xl:mt-0">
                  {user.approvalStatus === 'pending' ? (
                    <button onClick={() => openApproveRejectModal(user)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-all shadow-md shadow-blue-500/20">
                      Review Request
                    </button>
                  ) : (
                    <>
                      <button onClick={() => { setViewUser(user); setShowViewModal(true); }} className="p-2.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-all" title="View Details">
                        <Eye className="w-4.5 h-4.5" />
                      </button>
                      <button onClick={() => openEditModal(user)} className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all" title="Edit Profile">
                        <Edit className="w-4.5 h-4.5" />
                      </button>
                      <button
                        onClick={() => handleStatusChange(user._id, user.status === 'active' ? 'deactivated' : 'active', user.username)}
                        className={`p-2.5 rounded-xl transition-all ${user.status === 'active' ? 'text-slate-400 hover:text-orange-500 hover:bg-orange-50' : 'text-slate-400 hover:text-green-600 hover:bg-green-50'}`}
                      >
                        <Power className="w-4.5 h-4.5" />
                      </button>
                      <button onClick={() => handleDeleteUser(user._id, user.username)} className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all" title="Delete">
                        <Trash2 className="w-4.5 h-4.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-24 bg-white rounded-[32px] border border-slate-100 border-dashed">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">No Vendors Found</h3>
            <p className="text-slate-400 font-medium mt-1">Add a new vendor to get started.</p>
          </div>
        )}
      </div>

      {/* --- Modals [Redesigned] --- */}

      {/* 1. Add/Edit Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden ring-1 ring-black/5">
            <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-xl font-bold text-slate-800">{showAddModal ? 'Register New Vendor' : 'Edit Vendor Profile'}</h3>
              <button onClick={() => { setShowAddModal(false); setShowEditModal(false); }} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-full transition-all">
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8">
              <form onSubmit={showAddModal ? handleAddUser : handleEditUser} className="space-y-6">
                {/* Lab Info */}
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Laboratory Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="text" name="labName" value={formData.labName} onChange={(e) => setFormData({ ...formData, labName: e.target.value })} placeholder="Lab Name *" className="w-full px-5 py-3 text-sm font-medium bg-slate-50 border-none rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all" />
                    <input type="text" name="ownerName" value={formData.ownerName} onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })} placeholder="Owner Full Name *" className="w-full px-5 py-3 text-sm font-medium bg-slate-50 border-none rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all" />
                  </div>
                </div>

                {/* Contact Info */}
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Contact Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="email" name="contactEmail" value={formData.contactEmail} onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })} placeholder="Contact Email *" className="w-full px-5 py-3 text-sm font-medium bg-slate-50 border-none rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all" />
                    <input type="tel" name="phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="Phone Number *" className="w-full px-5 py-3 text-sm font-medium bg-slate-50 border-none rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all" />
                    <input type="url" name="website" value={formData.website} onChange={(e) => setFormData({ ...formData, website: e.target.value })} placeholder="Website (Optional)" className="w-full px-5 py-3 text-sm font-medium bg-slate-50 border-none rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all" />
                  </div>
                  <textarea name="address" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} placeholder="Full Address *" rows="2" className="w-full px-5 py-3 text-sm font-medium bg-slate-50 border-none rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all"></textarea>
                </div>

                {/* Account Info */}
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Account Credentials</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="text" name="username" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} placeholder="Username *" className="w-full px-5 py-3 text-sm font-medium bg-slate-50 border-none rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all" />
                    <input type="email" name="loginEmail" value={formData.loginEmail} onChange={(e) => setFormData({ ...formData, loginEmail: e.target.value })} placeholder="Login Email *" className="w-full px-5 py-3 text-sm font-medium bg-slate-50 border-none rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="password" name="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} placeholder={showEditModal ? "New Password (Leave empty) " : "Password *"} className="w-full px-5 py-3 text-sm font-medium bg-slate-50 border-none rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all" />
                    <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} placeholder={showEditModal ? "Confirm New Password" : "Confirm Password *"} className="w-full px-5 py-3 text-sm font-medium bg-slate-50 border-none rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all" />
                  </div>
                </div>

                <div className="pt-4 flex gap-4">
                  <button type="button" onClick={() => { setShowAddModal(false); setShowEditModal(false); }} className="flex-1 py-3.5 text-sm font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-2xl transition-colors">Cancel</button>
                  <button type="submit" disabled={isSubmitting} className="flex-1 py-3.5 text-sm font-bold text-white bg-[#0052FF] hover:bg-blue-600 rounded-2xl shadow-lg shadow-blue-500/20 transition-all">
                    {isSubmitting ? 'Processing...' : showAddModal ? 'Create Vendor' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 2. View Modal */}
      {showViewModal && viewUser && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden ring-1 ring-black/5">
            <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-xl font-bold text-slate-800">Vendor Profile</h3>
              <button onClick={() => setShowViewModal(false)} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-full transition-all">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="p-8 space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-[24px] bg-blue-50 text-blue-600 flex items-center justify-center text-3xl font-bold">
                  {viewUser.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="text-2xl font-bold text-slate-900">{viewUser.labName}</h4>
                  <p className="text-slate-500 font-medium">{viewUser.ownerName}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-5 rounded-2xl">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Status</p>
                  <span className="font-semibold text-slate-700">{viewUser.status}</span>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Phone</p>
                  <span className="font-semibold text-slate-700">{viewUser.phone || 'N/A'}</span>
                </div>
                <div className="col-span-2">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Email</p>
                  <span className="font-semibold text-slate-700">{viewUser.email}</span>
                </div>
                <div className="col-span-2">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Address</p>
                  <span className="font-semibold text-slate-700">{viewUser.address || 'N/A'}</span>
                </div>
              </div>

              <button onClick={() => setShowViewModal(false)} className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-2xl transition-colors">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-8 max-w-sm text-center shadow-2xl">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Trash2 className="w-10 h-10 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Delete Vendor?</h3>
            <p className="text-slate-500 text-sm mb-8">This will permanently remove <strong>{userToDelete?.username}</strong> and all associated data.</p>
            <div className="flex gap-4">
              <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-3 text-sm font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">Cancel</button>
              <button onClick={confirmDeleteUser} className="flex-1 py-3 text-sm font-bold text-white bg-red-500 hover:bg-red-600 rounded-xl shadow-lg shadow-red-500/30 transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Approve/Reject Confirmation */}
      {showApproveRejectModal && vendorToProcess && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-8 max-w-md text-center shadow-2xl">
            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-blue-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Review Request</h3>
            <p className="text-slate-500 text-sm mb-8">Choose an action for <strong>{vendorToProcess.labName}</strong>.</p>
            <div className="flex gap-4">
              <button onClick={() => handleRejectVendor(vendorToProcess)} className="flex-1 py-3 text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors">Reject</button>
              <button onClick={() => handleApproveVendor(vendorToProcess)} className="flex-1 py-3 text-sm font-bold text-white bg-green-500 hover:bg-green-600 rounded-xl shadow-lg shadow-green-500/20 transition-colors">Approve</button>
            </div>
            <button onClick={() => setShowApproveRejectModal(false)} className="mt-4 text-xs font-bold text-slate-400 hover:text-slate-600">Dismiss</button>
          </div>
        </div>
      )}

      {/* 5. Rejection Reason Modal */}
      {showRejectReasonModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Reason for Rejection</h3>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-red-200 min-h-[120px] text-sm font-medium mb-4"
              placeholder="Please explain why this vendor request is being rejected..."
            />
            <div className="flex gap-4">
              <button onClick={() => setShowRejectReasonModal(false)} className="flex-1 py-3 text-sm font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">Cancel</button>
              <button onClick={submitVendorRejection} className="flex-1 py-3 text-sm font-bold text-white bg-red-500 hover:bg-red-600 rounded-xl shadow-lg shadow-red-500/20 transition-colors">Confirm Rejection</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
