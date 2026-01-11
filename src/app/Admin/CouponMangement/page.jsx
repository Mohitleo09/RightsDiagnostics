"use client";

import { useEffect, useMemo, useState } from "react";
import { safeJsonParse } from "../../utils/apiUtils";
import {
  Edit,
  Trash2,
  Search,
  Plus,
  Ticket,
  Calendar,
  Percent,
  DollarSign,
  MoreVertical,
  Layers,
  CheckCircle2,
  XCircle,
  AlertCircle
} from 'lucide-react';

function formatDate(d) {
  try {
    const date = new Date(d);
    if (Number.isNaN(date.getTime())) return "-";
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  } catch {
    return "-";
  }
}

function getStatusColor(status) {
  switch (status) {
    case 'active': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'expired': return 'bg-red-100 text-red-700 border-red-200';
    case 'inactive': return 'bg-gray-100 text-gray-700 border-gray-200';
    default: return 'bg-gray-100 text-gray-700 border-gray-200';
  }
}

function statusFor(coupon) {
  const now = new Date();
  if (!coupon.isActive) return "inactive";
  if (coupon.validUntil && new Date(coupon.validUntil) < now) return "expired";
  return "active";
}

const initialForm = {
  code: "",
  discountType: "percentage",
  discountValue: "",
  maxDiscountAmount: "",
  minOrderAmount: "",
  validFrom: new Date().toISOString().split('T')[0],
  validUntil: "",
  usageLimit: "",
  usedCount: 0,
  applicableFor: "all",
  isActive: true,
};

export default function CouponManagementPage() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [form, setForm] = useState({ ...initialForm });
  const [submitting, setSubmitting] = useState(false);
  const [editingCouponId, setEditingCouponId] = useState(null);
  const [deletingCoupon, setDeletingCoupon] = useState(null);
  const [activeMenuId, setActiveMenuId] = useState(null);

  // Fetch coupons
  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/coupons?t=${Date.now()}`, {
        method: 'GET',
        headers: { 'Cache-Control': 'no-cache' },
      });

      if (!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`);

      const data = await safeJsonParse(res);
      if (data.success) {
        const uniqueCoupons = Array.from(
          new Map(data.data?.map(coupon => [coupon._id, coupon]) || []).values()
        );
        setCoupons(uniqueCoupons);
      } else {
        console.error("Failed to load coupons:", data.error);
        alert(`Failed to load coupons: ${data.error || 'Unknown error'}`);
      }
    } catch (e) {
      console.error("Error loading coupons:", e);
      alert(`Error loading coupons: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const filteredCoupons = useMemo(() => {
    if (!search) return coupons;
    return coupons.filter((c) => c.code?.toLowerCase().includes(search.toLowerCase()));
  }, [coupons, search]);

  const openModal = (coupon = null) => {
    if (coupon) {
      setForm({
        code: coupon.code || "",
        discountType: coupon.discountType || "percentage",
        discountValue: coupon.discountValue !== undefined ? coupon.discountValue : "",
        maxDiscountAmount: coupon.maxDiscountAmount || "",
        minOrderAmount: coupon.minOrderAmount || "",
        validFrom: coupon.validFrom ? new Date(coupon.validFrom).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        validUntil: coupon.validUntil ? new Date(coupon.validUntil).toISOString().split('T')[0] : "",
        usageLimit: coupon.usageLimit !== undefined ? coupon.usageLimit : "",
        usedCount: coupon.usedCount || 0,
        applicableFor: coupon.applicableFor || "all",
        isActive: coupon.isActive !== undefined ? coupon.isActive : true,
      });
      setEditingCouponId(coupon._id);
    } else {
      setForm({ ...initialForm });
      setEditingCouponId(null);
    }
    setIsModalOpen(true);
    setActiveMenuId(null);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setForm({ ...initialForm });
    setEditingCouponId(null);
  };

  const openDeleteModal = (coupon) => {
    setDeletingCoupon(coupon);
    setIsDeleteModalOpen(true);
    setActiveMenuId(null);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setDeletingCoupon(null);
  };

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const generateCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let out = "";
    for (let i = 0; i < 8; i++) out += chars[Math.floor(Math.random() * chars.length)];
    setForm((prev) => ({ ...prev, code: out }));
  };

  const createCoupon = async () => {
    if (!form.code.trim()) {
      alert("Please enter a coupon code");
      return;
    }
    if (!form.discountValue) {
      alert("Please enter a discount value");
      return;
    }
    if (!form.validUntil) {
      alert("Please select a valid until date");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        code: form.code.trim(),
        discountType: form.discountType,
        discountValue: Number(form.discountValue),
        maxDiscountAmount: form.maxDiscountAmount ? Number(form.maxDiscountAmount) : null,
        minOrderAmount: form.minOrderAmount ? Number(form.minOrderAmount) : 0,
        isActive: form.isActive,
        validFrom: form.validFrom,
        validUntil: form.validUntil,
        usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
        usedCount: Number(form.usedCount) || 0,
        applicableFor: form.applicableFor,
      };

      const method = editingCouponId ? "PUT" : "POST";
      const url = editingCouponId ? `/api/coupons?couponId=${editingCouponId}` : "/api/coupons";

      const res = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`API error: ${res.status} ${res.statusText}`);
      }

      const data = await safeJsonParse(res);
      if (data.success) {
        closeModal();
        fetchCoupons();
        alert(data.message || `${editingCouponId ? "Updated" : "Created"} coupon successfully`);
      } else {
        alert(data.error || `Failed to ${editingCouponId ? "update" : "create"} coupon`);
      }
    } catch (e) {
      alert(`Error ${editingCouponId ? "updating" : "creating"} coupon: ${e.message}`);
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingCoupon) return;

    try {
      const res = await fetch(`/api/coupons?couponId=${deletingCoupon._id}`, {
        method: "DELETE",
      });
      const data = await safeJsonParse(res);
      if (data.success) {
        fetchCoupons();
        closeDeleteModal();
      } else {
        alert(data.error || "Failed to delete coupon");
      }
    } catch (e) {
      alert("Error deleting coupon");
      console.error(e);
    }
  };

  const handleMenuClick = (e, id) => {
    e.stopPropagation();
    setActiveMenuId(activeMenuId === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 sm:p-10 font-sans relative">
      {/* Menu Backdrop */}
      {activeMenuId && (
        <div
          className="fixed inset-0 z-30 bg-transparent"
          onClick={() => setActiveMenuId(null)}
        />
      )}

      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
            <Ticket className="w-8 h-8 text-black" />
            Coupons
          </h1>
          <p className="text-gray-500 mt-1 text-sm font-medium">Manage your promotional campaigns</p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative group w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-black transition-colors w-4 h-4" />
            <input
              type="text"
              placeholder="Search coupons..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all shadow-sm"
            />
          </div>
          <button
            onClick={() => openModal()}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-all shadow-lg shadow-black/20 active:scale-95 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>New Coupon</span>
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
        {[
          { label: 'Active Campaigns', value: coupons.filter(c => statusFor(c) === 'active').length, icon: CheckCircle2, color: 'text-emerald-600' },
          { label: 'Total Coupons', value: coupons.length, icon: Layers, color: 'text-blue-600' },
          { label: 'Expired', value: coupons.filter(c => statusFor(c) === 'expired').length, icon: AlertCircle, color: 'text-orange-500' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">{stat.label}</p>
              <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
            </div>
            <div className={`p-3 rounded-xl bg-gray-50 ${stat.color}`}>
              <stat.icon className="w-6 h-6" />
            </div>
          </div>
        ))}
      </div>

      {/* Content Grid */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
        </div>
      ) : filteredCoupons.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 border-dashed">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Ticket className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">No coupons found</h3>
          <p className="text-gray-500 text-sm mt-1">Get started by creating your first coupon code.</p>
          <button onClick={() => openModal()} className="mt-6 text-black font-semibold text-sm hover:underline">
            Create Coupon &rarr;
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredCoupons.map((c) => {
            const status = statusFor(c);
            const isMenuOpen = activeMenuId === c._id;

            return (
              <div
                key={c._id}
                className={`group bg-white rounded-2xl border border-gray-200 shadow-sm transition-shadow duration-300 relative flex flex-col ${isMenuOpen ? 'z-50 shadow-lg' : 'hover:shadow-lg hover:border-gray-300 z-0'}`}
                style={{ zIndex: isMenuOpen ? 50 : 0 }}
              >
                {/* Decorative Top Bar */}
                <div className={`h-1.5 w-full rounded-t-2xl ${status === 'active' ? 'bg-gradient-to-r from-emerald-400 to-teal-500' : status === 'expired' ? 'bg-red-400' : 'bg-gray-300'}`}></div>

                <div className="p-5 flex-1 flex flex-col">
                  {/* Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
                      <span className="font-mono font-bold text-gray-800 tracking-wider text-sm">{c.code}</span>
                    </div>
                    <div className="relative">
                      <button
                        onClick={(e) => handleMenuClick(e, c._id)}
                        className={`p-1.5 rounded-full transition-colors ${isMenuOpen ? 'bg-gray-100 text-black' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'}`}
                      >
                        <MoreVertical className="w-4 h-4 pointer-events-none" />
                      </button>

                      {/* Dropdown Menu */}
                      {isMenuOpen && (
                        <div className="absolute right-0 top-full mt-1 w-36 bg-white rounded-xl shadow-xl border border-gray-100 z-[60] overflow-hidden py-1 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                          <button
                            onClick={(e) => { e.stopPropagation(); openModal(c); }}
                            className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 font-medium"
                          >
                            <Edit className="w-4 h-4 text-gray-400 pointer-events-none" /> Edit
                          </button>
                          <div className="h-px bg-gray-50 my-0.5"></div>
                          <button
                            onClick={(e) => { e.stopPropagation(); openDeleteModal(c); }}
                            className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 font-medium"
                          >
                            <Trash2 className="w-4 h-4 text-red-500 pointer-events-none" /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Main Value */}
                  <div className="mb-4">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-extrabold text-gray-900">
                        {c.discountType === 'percentage' ? c.discountValue : `₹${c.discountValue}`}
                      </span>
                      <span className="text-lg font-bold text-gray-500">
                        {c.discountType === 'percentage' ? '%' : ''} OFF
                      </span>
                    </div>
                    {c.maxDiscountAmount && (
                      <p className="text-xs text-gray-400 font-medium mt-1">Up to ₹{c.maxDiscountAmount}</p>
                    )}
                  </div>

                  {/* Details Grid */}
                  <div className="mt-auto space-y-3 pt-4 border-t border-dashed border-gray-200 relative">
                    {/* Semi-circles for ticket effect */}
                    <div className="absolute -left-[26px] -top-[6px] w-3 h-3 rounded-full bg-gray-50/50"></div>
                    <div className="absolute -right-[26px] -top-[6px] w-3 h-3 rounded-full bg-gray-50/50"></div>

                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Valid until</span>
                      </div>
                      <span className="font-medium text-gray-700">{formatDate(c.validUntil)}</span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5" />
                        <span>Usage</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="font-medium text-gray-900">{c.usedCount || 0}</span>
                        <span className="text-gray-300">/</span>
                        <span>{c.usageLimit || "∞"}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status Footer */}
                <div className={`px-5 py-3 rounded-b-2xl ${status === 'active' ? 'bg-emerald-50/50 text-emerald-700' :
                  status === 'expired' ? 'bg-red-50/50 text-red-700' : 'bg-gray-50 text-gray-600'
                  } flex items-center justify-between text-xs font-bold uppercase tracking-wider`}>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${status === 'active' ? 'bg-emerald-500' : status === 'expired' ? 'bg-red-500' : 'bg-gray-500'
                      }`}></span>
                    {status}
                  </div>
                  {c.minOrderAmount > 0 && <span>Min Order: ₹{c.minOrderAmount}</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal - Modern & Clean */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity"
            onClick={closeModal}
          ></div>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden relative z-10 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-gray-50 px-8 py-6 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{editingCouponId ? 'Edit Configuration' : 'New Campaign'}</h2>
                <p className="text-gray-500 text-sm mt-1">Setup your coupon details and restraints</p>
              </div>
              <button onClick={closeModal} className="p-2 bg-white rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 border border-gray-200 transition-all">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-8 max-h-[70vh] overflow-y-auto">
              {/* Code Section */}
              <div className="mb-8">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Coupon Code</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      name="code"
                      value={form.code || ""}
                      onChange={onChange}
                      placeholder="SUMMER2025"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-black focus:ring-0 transition-all font-mono text-lg tracking-wide uppercase font-bold text-gray-900 placeholder-gray-300"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={generateCode}
                    className="px-6 py-2 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors shadow-lg shadow-gray-200"
                  >
                    Randomize
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                {/* Discount Type */}
                <div className="col-span-1">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Discount Type</label>
                  <div className="grid grid-cols-2 gap-2 bg-gray-100 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setForm(f => ({ ...f, discountType: 'percentage' }))}
                      className={`py-2 text-sm font-medium rounded-lg transition-all ${form.discountType === 'percentage' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                      Percentage
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm(f => ({ ...f, discountType: 'fixed' }))}
                      className={`py-2 text-sm font-medium rounded-lg transition-all ${form.discountType === 'fixed' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                      Fixed Amount
                    </button>
                  </div>
                </div>

                {/* Value */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Value</label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      {form.discountType === 'percentage' ? <Percent className="w-4 h-4" /> : <DollarSign className="w-4 h-4" />}
                    </div>
                    <input
                      type="number"
                      name="discountValue"
                      value={form.discountValue || ""}
                      onChange={onChange}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:border-black focus:ring-0 transition-all"
                      placeholder="0"
                    />
                  </div>
                </div>

                {/* Restraints Section */}
                <div className="col-span-full pt-4 border-t border-gray-100">
                  <h3 className="text-sm font-bold text-gray-900 mb-4">Constraints & Validity</h3>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Min. Order (₹)</label>
                  <input
                    type="number"
                    name="minOrderAmount"
                    value={form.minOrderAmount || ""}
                    onChange={onChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-black focus:ring-0 transition-all"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Max. Discount (₹)</label>
                  <input
                    type="number"
                    name="maxDiscountAmount"
                    value={form.maxDiscountAmount || ""}
                    onChange={onChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-black focus:ring-0 transition-all"
                    placeholder="Unlimited"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Valid From</label>
                  <input
                    type="date"
                    name="validFrom"
                    value={form.validFrom || ""}
                    onChange={onChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-black focus:ring-0 transition-all text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Valid Until</label>
                  <input
                    type="date"
                    name="validUntil"
                    value={form.validUntil || ""}
                    onChange={onChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-black focus:ring-0 transition-all text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Usage Limit</label>
                  <input
                    type="number"
                    name="usageLimit"
                    value={form.usageLimit || ""}
                    onChange={onChange}
                    placeholder="∞"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-black focus:ring-0 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Target Audience</label>
                  <select
                    name="applicableFor"
                    value={form.applicableFor || "all"}
                    onChange={onChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-black focus:ring-0 transition-all bg-white"
                  >
                    <option value="all">Everyone</option>
                    <option value="new_users">First-time Buyers</option>
                    <option value="existing_users">Returning Customers</option>
                  </select>
                </div>

                <div className="col-span-full flex items-center gap-3 p-4 bg-gray-50 rounded-xl mt-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    name="isActive"
                    checked={form.isActive !== undefined ? form.isActive : true}
                    onChange={onChange}
                    className="w-5 h-5 text-black border-gray-300 rounded focus:ring-black"
                  />
                  <div>
                    <label htmlFor="isActive" className="text-sm font-bold text-gray-900 block">Activate Immediately</label>
                    <p className="text-xs text-gray-500">Coupon will be usable as soon as it is created.</p>
                  </div>
                </div>

              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-8 py-5 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={closeModal}
                className="px-6 py-2.5 text-gray-600 font-medium hover:bg-gray-200 rounded-xl transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={createCoupon}
                disabled={submitting}
                className="px-8 py-2.5 bg-black text-white font-medium rounded-xl hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm shadow-lg shadow-black/10"
              >
                {submitting ? 'Processing...' : (editingCouponId ? 'Save Changes' : 'Create Coupon')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal - Clean */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity"
            onClick={closeDeleteModal}
          ></div>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md relative z-10 p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Delete Coupon?</h2>
            <p className="text-gray-500 mb-6">
              This will permanently remove <span className="font-mono font-bold text-gray-800">{deletingCoupon?.code}</span>. This action cannot be undone.
            </p>

            <div className="flex gap-3">
              <button
                onClick={closeDeleteModal}
                className="flex-1 px-4 py-3 border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-200"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}