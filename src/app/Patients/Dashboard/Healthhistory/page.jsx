'use client';

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import Link from 'next/link';
import { Ruler, Scale, Pill, FileText, Upload, Save, X, Edit3, User, Calendar, Wallet, Ticket } from 'lucide-react';
import Navbar from '../../page';
import Footer from '../../Footer/page';
import { isProfileComplete, isAdditionalInfoComplete } from '../../../utils/profileUtils';
import { safeJsonParse } from '../../../utils/apiUtils';
import { hasRedirected, setRedirectFlag, resetRedirectFlag } from '../../../utils/redirectUtils';

// Sidebar components matching the main dashboard


const SidebarItem = ({ icon, label, href, active }) => (
  <Link href={href || '#'} className={`w-full flex items-center gap-3 px-4 py-4 rounded-xl border transition-all ${active
    ? 'border-[#007AFF] bg-blue-50 shadow-[inset_4px_0_0_0_#007AFF]'
    : 'border-gray-200 hover:bg-gray-50'
    }`}>
    <span className="inline-flex items-center justify-center w-6 h-6">{icon}</span>
    <span className={`text-[15px] font-semibold ${active ? 'text-gray-900' : 'text-gray-800'}`}>{label}</span>
  </Link>
);

// Notification component for unsaved health history
const HealthHistoryNotification = ({ isVisible, onClose }) => {
  if (!isVisible) return null;

  return (
    <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mx-4 md:mx-8 mt-4 rounded">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <p className="text-sm text-blue-700">
            <span className="font-medium">Update Required: </span>
            Please update your health history details to ensure we have the most accurate information for your care.
          </p>
        </div>
        <div className="ml-auto pl-3">
          <div className="-mx-1.5 -my-1.5">
            <button
              onClick={onClose}
              className="inline-flex bg-blue-50 rounded-md p-1.5 text-blue-500 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-blue-50 focus:ring-blue-600"
            >
              <span className="sr-only">Dismiss</span>
              <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function HealthHistoryPage() {
  const router = useRouter();
  const hasMounted = useRef(false);
  const [userName, setUserName] = useState('User');
  const [formData, setFormData] = useState({
    height: "",
    weight: "",
    currentMedications: "",
    previousMedications: "",
    documents: [],
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isFetching, setIsFetching] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showNotification, setShowNotification] = useState(false);

  // Get user name from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUserName = localStorage.getItem('userName') || 'User';
      setUserName(storedUserName);
    }
  }, []);

  // Fetch existing data when component mounts
  useEffect(() => {
    const fetchExistingData = async () => {
      try {
        setIsFetching(true);
        console.log("🔄 Fetching health history data...");
        const response = await fetch("/api/patient-healthhistory");
        const result = await safeJsonParse(response);
        console.log("📥 API Response:", result);

        if (result.success && result.data) {
          const fetchedData = {
            height: result.data.height || "",
            weight: result.data.weight || "",
            currentMedications: result.data.currentMedications || "",
            previousMedications: result.data.previousMedications || ""
          };
          console.log("✅ Setting form data:", fetchedData);
          setFormData(fetchedData);

          // Check if health history is complete
          const isHealthHistoryComplete = fetchedData.height && fetchedData.weight &&
            fetchedData.currentMedications && fetchedData.previousMedications;
          setShowNotification(!isHealthHistoryComplete);
        } else {
          console.log("⚠️ No data received or error:", result);
          // Set empty data if no data received
          setFormData({
            height: "",
            weight: "",
            currentMedications: "",
            previousMedications: ""
          });
          setShowNotification(true);
        }
      } catch (error) {
        console.error("Error fetching existing data:", error);
        setShowNotification(true);
      } finally {
        setIsFetching(false);
      }
    };

    fetchExistingData();

    // Refresh data when window gains focus
    const handleFocus = () => {
      console.log("🎯 Window focused, refreshing data...");
      fetchExistingData();
    };

    // Refresh data when document becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log("👁️ Tab became visible, refreshing data...");
        fetchExistingData();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup event listeners
    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Check if user should be on this page
  useEffect(() => {
    const checkRedirect = async () => {
      // Prevent multiple redirects
      if (typeof window !== 'undefined' && hasRedirected()) {
        return;
      }

      try {
        // First check if profile is complete
        const profileResponse = await fetch("/api/profile");
        const profileData = await safeJsonParse(profileResponse);

        if (profileData.success && profileData.user) {
          // If profile is not complete, redirect to main dashboard
          if (!isProfileComplete(profileData.user)) {
            setRedirectFlag();
            // Add a small delay to prevent immediate redirects
            setTimeout(() => {
              router.push('/Patients/Dashboard');
            }, 1000);
            return;
          }

          // If additional info is already complete, redirect to homepage
          const additionalResponse = await fetch("/api/patient-healthhistory");
          const additionalData = await safeJsonParse(additionalResponse);

          if (additionalData.success && additionalData.data &&
            isAdditionalInfoComplete(additionalData.data)) {
            setRedirectFlag();
            // Add a small delay to prevent immediate redirects
            setTimeout(() => {
              router.push('/');
            }, 1000);
          }
        }
      } catch (error) {
        console.error("Error checking redirect status:", error);
      }
    };

    // Only run this check if we're on the client side
    if (typeof window !== 'undefined') {
      checkRedirect();
    }
  }, [router]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const newData = { ...prev, [name]: value };
      console.log("📝 Form data updated:", newData);
      return newData;
    });
  };

  // Add a useEffect to log formData changes
  useEffect(() => {
    console.log("📊 Current formData:", formData);
  }, [formData]);

  const handleFileChange = (e) => {
    // Handle multiple file selection
    const files = Array.from(e.target.files);
    setFormData((prev) => ({ ...prev, documents: files }));
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      // Create FormData for file upload
      const data = new FormData();
      // Send height value as-is without conversion
      data.append("height", formData.height);
      data.append("weight", formData.weight);
      data.append("currentMedications", formData.currentMedications);
      data.append("previousMedications", formData.previousMedications);

      // Append all documents
      if (formData.documents && formData.documents.length > 0) {
        formData.documents.forEach((file, index) => {
          data.append("documents", file);
        });
      }

      const response = await fetch("/api/patient-healthhistory", {
        method: "POST",
        body: data,
      });

      const result = await safeJsonParse(response);
      console.log("💾 Save response:", result);

      if (result.success) {
        setMessage("Information saved successfully!");
        setIsEditing(false);
        setShowNotification(false); // Hide notification when data is saved
        // Reset the redirect flag so the homepage can load properly
        resetRedirectFlag();

        // Always fetch fresh data after saving
        console.log("🔄 Refreshing data after save...");
        const refreshResponse = await fetch("/api/patient-healthhistory");
        const refreshResult = await safeJsonParse(refreshResponse);
        console.log("📥 Refresh response:", refreshResult);

        if (refreshResult.success && refreshResult.data) {
          const updatedData = {
            height: refreshResult.data.height || "",
            weight: refreshResult.data.weight || "",
            currentMedications: refreshResult.data.currentMedications || "",
            previousMedications: refreshResult.data.previousMedications || ""
          };
          console.log("✅ Updating form data with:", updatedData);
          setFormData(prev => ({
            ...prev,
            ...updatedData
          }));
        }

        // Redirect to homepage after successful submission
        // setTimeout(() => {
        //   router.push("/");
        // }, 2000);
      } else {
        setMessage(`Error: ${result.message || "Failed to save information"}`);
      }
    } catch (error) {
      console.error("Error saving information:", error);
      setMessage("An error occurred while saving information.");
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 w-full bg-white px-4 md:px-8 py-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-[360px_1fr] gap-6">
          {/* Left Sidebar */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-4 md:p-6">
            <div className="flex items-start gap-4 rounded-xl border border-[#00A3FF] bg-[#00CCFF] p-4 mb-5">
              <div className="flex-1">
                <div className="text-[17px] font-extrabold text-gray-900">{userName}</div>
                <div className="text-[14px] text-gray-700 leading-snug">User Dashboard</div>
                <div className="text-[14px] text-gray-700">Manage your profile</div>
              </div>
            </div>

            <div className="space-y-3">
              <SidebarItem icon={<User className="w-5 h-5" />} label="Profile settings" href="/Patients/Dashboard" />
              <SidebarItem icon={<Calendar className="w-5 h-5" />} label="Upcoming Appointments" href="/Patients/Dashboard/upcoming" />
              <SidebarItem icon={<Wallet className="w-5 h-5" />} label="Digital Wallet Balance" href="/Patients/Dashboard/wallet" />
              <SidebarItem icon={<Ticket className="w-5 h-5" />} label="Membership Packages" href="/Patients/Dashboard/membership" />
              <SidebarItem icon={<FileText className="w-5 h-5" />} label="Health history" href="/Patients/Dashboard/Healthhistory" active />
            </div>
          </div>

          {/* Main Content Area */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-4 md:p-6">
            <div className="flex justify-between items-end mb-8 border-b border-gray-50 pb-6">
              <div>
                <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Health History</h1>
                <p className="text-sm text-gray-500 mt-2 font-medium">Manage your physical details and medical records</p>
              </div>
              <button
                onClick={isEditing ? handleSubmit : handleEdit}
                className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm hover:shadow-md active:scale-95 ${isEditing
                  ? 'bg-green-600 text-white hover:bg-green-700 ring-2 ring-green-100'
                  : 'bg-[#007AFF] text-white hover:bg-[#0052FF] ring-2 ring-blue-100'
                  }`}
              >
                {isEditing ? <Save className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                <span>{isEditing ? 'Save Changes' : 'Edit Details'}</span>
              </button>
            </div>

            <div className="max-w-3xl">
              <div className="bg-white rounded-lg">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgb(0,0,0,0.02)] space-y-6">
                    <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3 mb-4">
                      Physical Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Height Field */}
                      <div className="relative">
                        <div className="absolute top-4 left-4 text-[#007AFF]">
                          <Ruler className="w-5 h-5" />
                        </div>
                        <input
                          type="number"
                          id="height"
                          name="height"
                          value={formData.height}
                          onChange={handleChange}
                          className="peer w-full pl-12 pr-4 py-3.5 rounded-xl border border-gray-200 bg-white text-gray-900 font-semibold focus:border-[#007AFF] focus:outline-none focus:ring-4 focus:ring-[#007AFF]/10 disabled:opacity-100 placeholder-transparent transition-all"
                          placeholder="Height"
                          required
                          disabled={!isEditing}
                          step="0.1"
                        />
                        <label
                          htmlFor="height"
                          className="absolute left-10 -top-2.5 bg-white px-2 text-xs font-medium text-[#007AFF] transition-all 
                          peer-placeholder-shown:left-12 peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-500 
                          peer-focus:left-10 peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-[#007AFF] pointer-events-none"
                        >
                          Height (cm/ft) <span className="text-red-500">*</span>
                        </label>
                      </div>

                      {/* Weight Field */}
                      <div className="relative">
                        <div className="absolute top-4 left-4 text-[#007AFF]">
                          <Scale className="w-5 h-5" />
                        </div>
                        <input
                          type="number"
                          id="weight"
                          name="weight"
                          value={formData.weight}
                          onChange={handleChange}
                          className="peer w-full pl-12 pr-4 py-3.5 rounded-xl border border-gray-200 bg-white text-gray-900 font-semibold focus:border-[#007AFF] focus:outline-none focus:ring-4 focus:ring-[#007AFF]/10 disabled:opacity-100 placeholder-transparent transition-all"
                          placeholder="Weight"
                          required
                          disabled={!isEditing}
                        />
                        <label
                          htmlFor="weight"
                          className="absolute left-10 -top-2.5 bg-white px-2 text-xs font-medium text-[#007AFF] transition-all 
                          peer-placeholder-shown:left-12 peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-500 
                          peer-focus:left-10 peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-[#007AFF] pointer-events-none"
                        >
                          Weight (kg) <span className="text-red-500">*</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgb(0,0,0,0.02)] space-y-6">
                    <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3 mb-4 flex items-center gap-2">
                      <Pill className="w-5 h-5 text-[#007AFF]" />
                      Medication History
                    </h3>

                    <div className="space-y-6">
                      {/* Current Medications */}
                      <div className="relative">
                        <textarea
                          id="currentMedications"
                          name="currentMedications"
                          rows={3}
                          value={formData.currentMedications}
                          onChange={handleChange}
                          className="peer w-full p-4 rounded-xl border border-gray-200 text-gray-900 placeholder-transparent focus:outline-none focus:border-[#007AFF] focus:ring-4 focus:ring-[#007AFF]/10 disabled:opacity-100 resize-none transition-all font-medium"
                          placeholder="Current Medications"
                          required
                          disabled={!isEditing}
                        />
                        <label
                          htmlFor="currentMedications"
                          className="absolute left-4 -top-2.5 bg-white px-2 text-xs font-medium text-[#007AFF] transition-all 
                          peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-placeholder-shown:text-gray-500 
                          peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-[#007AFF] pointer-events-none"
                        >
                          Current Medications <span className="text-red-500">*</span>
                        </label>
                      </div>

                      {/* Previous Medications */}
                      <div className="relative">
                        <textarea
                          id="previousMedications"
                          name="previousMedications"
                          rows={3}
                          value={formData.previousMedications}
                          onChange={handleChange}
                          className="peer w-full p-4 rounded-xl border border-gray-200 text-gray-900 placeholder-transparent focus:outline-none focus:border-[#007AFF] focus:ring-4 focus:ring-[#007AFF]/10 disabled:opacity-100 resize-none transition-all font-medium"
                          placeholder="Previous Medications"
                          required
                          disabled={!isEditing}
                        />
                        <label
                          htmlFor="previousMedications"
                          className="absolute left-4 -top-2.5 bg-white px-2 text-xs font-medium text-[#007AFF] transition-all 
                          peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-placeholder-shown:text-gray-500 
                          peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-[#007AFF] pointer-events-none"
                        >
                          Previous Medications <span className="text-red-500">*</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Document Upload */}
                  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgb(0,0,0,0.02)] space-y-4">
                    <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3 mb-2 flex items-center gap-2">
                      <Upload className="w-5 h-5 text-[#007AFF]" />
                      Documents
                    </h3>
                    <div className="group">
                      <label
                        className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-all ${isEditing
                          ? 'border-gray-200 hover:bg-blue-50/50 hover:border-[#007AFF]'
                          : 'border-gray-100 bg-gray-50/50 cursor-not-allowed'}`}
                      >
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <div className="p-2 bg-blue-50 rounded-full mb-2">
                            <Upload className="w-6 h-6 text-[#2874F0]" />
                          </div>
                          <p className="mb-1 text-sm text-gray-500"><span className="font-semibold text-[#2874F0]">Click to upload</span></p>
                          <p className="text-xs text-gray-500">PDF, JPG, PNG (Max 5MB)</p>
                        </div>
                        <input
                          type="file"
                          name="documents"
                          className="sr-only"
                          onChange={handleFileChange}
                          multiple
                          disabled={!isEditing}
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        />
                      </label>
                    </div>

                    {/* Display selected file names */}
                    {formData.documents && formData.documents.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                        {formData.documents.map((file, index) => (
                          <div key={index} className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <FileText className="w-5 h-5 text-[#2874F0] mr-3 flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                              <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                            </div>
                            {isEditing && (
                              <button type="button" onClick={() => {
                                const newDocs = [...formData.documents];
                                newDocs.splice(index, 1);
                                setFormData({ ...formData, documents: newDocs });
                              }} className="ml-2 text-gray-400 hover:text-red-500">
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  {isEditing && (
                    <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 md:static md:bg-transparent md:border-0 md:p-0 flex flex-col sm:flex-row gap-3 z-50">
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="flex-1 py-3 px-6 border border-gray-200 rounded-xl shadow-sm text-sm font-bold text-gray-700 hover:bg-gray-50 focus:outline-none transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 py-3 px-6 rounded-xl shadow-lg shadow-blue-500/30 text-sm font-bold text-white bg-[#007AFF] hover:bg-[#0052FF] focus:outline-none disabled:opacity-70 transition-all transform active:scale-95"
                      >
                        {loading ? "Saving..." : "Save Details"}
                      </button>
                    </div>
                  )}
                </form>

                {message && (
                  <div className={`mt-6 p-4 rounded-lg border ${message.includes("successfully") ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"}`}>
                    <div className="flex">
                      <svg className={`flex-shrink-0 w-5 h-5 ${message.includes("successfully") ? "text-green-400" : "text-red-400"}`} fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" d={message.includes("successfully") ? "M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" : "M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"} clipRule="evenodd"></path>
                      </svg>
                      <div className="ml-3">
                        <p className="text-sm font-medium">{message}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div >
      <Footer />
    </div >
  );
}