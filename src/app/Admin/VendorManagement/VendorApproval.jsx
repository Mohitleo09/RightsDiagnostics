import { useState, useEffect } from 'react';
import { safeJsonParse } from '../../utils/apiUtils';
import { CheckCircle, XCircle, AlertCircle, Building2, User, Phone, Mail, Clock } from 'lucide-react';

const VendorApproval = ({ onVendorsUpdate }) => {
  const [pendingVendors, setPendingVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rejectionReason, setRejectionReason] = useState('');
  const [vendorToProcess, setVendorToProcess] = useState(null);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);

  // Fetch pending vendors
  const fetchPendingVendors = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/vendors');
      const result = await safeJsonParse(response);

      if (result.success) {
        const pending = result.vendors.filter(vendor => vendor.approvalStatus === 'pending');
        setPendingVendors(pending);
      }
    } catch (error) {
      console.error('Error fetching pending vendors:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get approval status badge
  const getApprovalStatusBadge = (approvalStatus) => {
    switch (approvalStatus) {
      case 'approved':
        return <span className="px-3 py-1 inline-flex text-xs font-bold rounded-full bg-green-100 text-green-700 uppercase tracking-wider">Approved</span>;
      case 'pending':
        return <span className="px-3 py-1 inline-flex text-xs font-bold rounded-full bg-amber-100 text-amber-700 uppercase tracking-wider flex items-center gap-1"><Clock className="w-3 h-3" /> Pending</span>;
      case 'rejected':
        return <span className="px-3 py-1 inline-flex text-xs font-bold rounded-full bg-red-100 text-red-700 uppercase tracking-wider">Rejected</span>;
      default:
        return <span className="px-3 py-1 inline-flex text-xs font-bold rounded-full bg-slate-100 text-slate-600 uppercase tracking-wider">{approvalStatus || 'Unknown'}</span>;
    }
  };

  // Handle vendor approval
  const handleApproveVendor = async () => {
    try {
      const response = await fetch('/api/vendors/approval', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vendorId: vendorToProcess._id,
          action: 'approve'
        }),
      });

      const result = await safeJsonParse(response);

      if (result.success) {
        fetchPendingVendors();
        if (onVendorsUpdate) onVendorsUpdate();
        closeApproveModal();
      } else {
        alert('Failed to approve vendor: ' + result.error);
      }
    } catch (err) {
      console.error('Error approving vendor:', err);
      alert('Error approving vendor');
    }
  };

  // Handle vendor rejection
  const handleRejectVendor = async () => {
    if (!rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    try {
      const response = await fetch('/api/vendors/approval', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vendorId: vendorToProcess._id,
          action: 'reject',
          rejectionReason: rejectionReason
        }),
      });

      const result = await safeJsonParse(response);

      if (result.success) {
        fetchPendingVendors();
        if (onVendorsUpdate) onVendorsUpdate();
        closeRejectModal();
      } else {
        alert('Failed to reject vendor: ' + result.error);
      }
    } catch (err) {
      console.error('Error rejecting vendor:', err);
      alert('Error rejecting vendor');
    }
  };

  // Modal handlers
  const openApproveModal = (vendor) => {
    setVendorToProcess(vendor);
    setIsApproveModalOpen(true);
  };

  const closeApproveModal = () => {
    setIsApproveModalOpen(false);
    setVendorToProcess(null);
  };

  const openRejectModal = (vendor) => {
    setVendorToProcess(vendor);
    setIsRejectModalOpen(true);
  };

  const closeRejectModal = () => {
    setIsRejectModalOpen(false);
    setVendorToProcess(null);
    setRejectionReason('');
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchPendingVendors();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12 bg-white rounded-[24px]">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
        <span className="ml-3 text-slate-500 font-medium">Checking approvals...</span>
      </div>
    );
  }

  if (pendingVendors.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden mb-8 animate-in fade-in duration-500">
      <div className="px-8 py-6 border-b border-slate-100 bg-amber-50/50 flex items-center gap-3">
        <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
          <AlertCircle className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">Pending Approvals</h2>
          <p className="text-sm text-slate-500 font-medium">Action required for the following registrations.</p>
        </div>
      </div>

      <div className="p-6 grid gap-4">
        {pendingVendors.map((vendor) => (
          <div key={vendor._id} className="group relative flex flex-col md:flex-row items-center p-5 bg-white border border-slate-100 rounded-[20px] hover:border-amber-200 hover:shadow-lg hover:shadow-amber-500/5 transition-all duration-300">

            {/* Main Info */}
            <div className="flex items-center gap-4 flex-1 w-full">
              <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center font-bold text-lg shadow-sm">
                {vendor.labName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h4 className="text-lg font-bold text-slate-800">{vendor.labName}</h4>
                <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                  <User className="w-3 h-3" /> {vendor.ownerName}
                </div>
              </div>
            </div>

            {/* Contact Details */}
            <div className="flex flex-col gap-1 w-full md:w-auto my-4 md:my-0 md:mr-8">
              <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                <Mail className="w-4 h-4 text-slate-400" /> {vendor.contactEmail}
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                <Phone className="w-4 h-4 text-slate-400" /> {vendor.phone || 'N/A'}
              </div>
            </div>

            {/* Status Badge */}
            <div className="mr-6 hidden md:block">
              {getApprovalStatusBadge(vendor.approvalStatus)}
            </div>

            {/* Actions */}
            <div className="flex gap-2 w-full md:w-auto mt-2 md:mt-0">
              <button onClick={() => openApproveModal(vendor)} className="flex-1 md:flex-none px-4 py-2.5 bg-green-500 hover:bg-green-600 text-white text-sm font-bold rounded-xl transition-all shadow-md shadow-green-500/20">
                Approve
              </button>
              <button onClick={() => openRejectModal(vendor)} className="flex-1 md:flex-none px-4 py-2.5 bg-white border border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-100 text-slate-600 text-sm font-bold rounded-xl transition-all">
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>


      {/* Approve Modal */}
      {isApproveModalOpen && vendorToProcess && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-8 max-w-sm text-center shadow-2xl">
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Approve Vendor?</h3>
            <p className="text-slate-500 text-sm mb-8">
              This will activate <strong>{vendorToProcess.labName}</strong> and allow them to access their dashboard immediately.
            </p>
            <div className="flex gap-4">
              <button onClick={closeApproveModal} className="flex-1 py-3 text-sm font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">Cancel</button>
              <button onClick={handleApproveVendor} className="flex-1 py-3 text-sm font-bold text-white bg-green-500 hover:bg-green-600 rounded-xl shadow-lg shadow-green-500/30 transition-colors">Confirm</button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {isRejectModalOpen && vendorToProcess && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-50 rounded-full text-red-500"><XCircle className="w-6 h-6" /></div>
              <h3 className="text-lg font-bold text-slate-800">Reject Vendor Request</h3>
            </div>

            <p className="text-sm text-slate-500 mb-4">Please provide a reason for rejecting <strong>{vendorToProcess.labName}</strong>.</p>

            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-red-200 min-h-[120px] text-sm font-medium mb-6 resize-none"
              placeholder="Reason for rejection..."
            />

            <div className="flex gap-4">
              <button onClick={closeRejectModal} className="flex-1 py-3 text-sm font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">Cancel</button>
              <button onClick={handleRejectVendor} className="flex-1 py-3 text-sm font-bold text-white bg-red-500 hover:bg-red-600 rounded-xl shadow-lg shadow-red-500/20 transition-colors">Reject Vendor</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorApproval;