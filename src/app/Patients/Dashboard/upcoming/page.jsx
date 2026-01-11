'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Calendar, Clock, MapPin, User, Phone, Mail, FileText, CalendarClock, Ticket, CalendarDays, RotateCcw, Wallet, Loader2, CreditCard, Lock } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import Navbar from '../../page';
import Footer from '../../Footer/page';
import { safeJsonParse } from '../../../utils/apiUtils';

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

// Utility function for formatting date and time
const formatDateTime = (dateString, timeString) => {
  const dateTime = new Date(`${dateString}T${timeString}`);
  return dateTime.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }) + ' at ' + dateTime.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

// Reschedule Modal Component
const RescheduleModal = ({ booking, onClose, onReschedule }) => {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [bookedSlots, setBookedSlots] = useState([]);

  // Generate time slots (memoized to prevent infinite loop)
  const timeSlots = useMemo(() => {
    const slots = { morning: [], afternoon: [], evening: [] };

    const now = new Date();
    const currentDate = now.toISOString().split('T')[0];
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    for (let hour = 8; hour <= 20; hour++) {
      for (let min = 0; min < 60; min += 30) {
        if (hour === 20 && min > 0) break;
        const time24 = `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
        const hour12 = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const time12 = `${hour12}:${String(min).padStart(2, '0')} ${ampm}`;

        // Check if this time slot is in the past
        const isPast = selectedDate === currentDate && time24 < currentTime;

        if (hour >= 8 && hour < 12) {
          slots.morning.push({ value: time24, label: time12, isPast });
        } else if (hour >= 12 && hour < 17) {
          slots.afternoon.push({ value: time24, label: time12, isPast });
        } else {
          slots.evening.push({ value: time24, label: time12, isPast });
        }
      }
    }
    return slots;
  }, [selectedDate]);

  // Get minimum date (today)
  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Fetch booked slots when date changes
  useEffect(() => {
    const fetchBookedSlots = async () => {
      if (selectedDate && booking.location) {
        try {
          const response = await fetch('/api/check-slot-availability', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              labName: booking.location,
              appointmentDate: selectedDate,
              getAllSlots: true
            }),
          });

          if (!response.ok) {
            console.error('Failed to fetch booked slots:', response.status);
            return;
          }

          const data = await safeJsonParse(response);
          if (data.success && data.bookedSlots) {
            setBookedSlots(data.bookedSlots);
          }
        } catch (error) {
          console.error('Error fetching booked slots:', error);
        }
      } else {
        setBookedSlots([]);
      }
    };

    fetchBookedSlots();
  }, [selectedDate, booking.location]);

  const handleReschedule = async () => {
    if (!selectedDate || !selectedTime) {
      setError('Please select both date and time');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      // Check slot availability
      const availabilityResponse = await fetch('/api/check-slot-availability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          labName: booking.location,
          appointmentDate: selectedDate,
          appointmentTime: selectedTime,
        }),
      });

      if (!availabilityResponse.ok) {
        throw new Error(`Failed to check slot availability: HTTP ${availabilityResponse.status}`);
      }

      const availabilityData = await availabilityResponse.json();

      if (!availabilityData.success) {
        throw new Error(availabilityData.error || 'Failed to check slot availability');
      }

      if (!availabilityData.available) {
        setError('This time slot is no longer available. Please select a different time slot.');
        return;
      }

      // Update booking - using the correct booking ID
      const response = await fetch('/api/bookings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId: booking.bookingId || booking.id, // Use bookingId if available, otherwise fallback to id
          updates: {
            appointmentDate: selectedDate,
            appointmentTime: selectedTime,
            formattedTime: getFormattedTime(selectedTime)
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await safeJsonParse(response);

      if (!result.success) {
        throw new Error(result.error || 'Failed to update booking');
      }

      setSuccess(true);
      // Call the parent's onReschedule function to refresh the data
      setTimeout(() => {
        onReschedule(result.booking);
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Error rescheduling booking:', error);
      setError(error.message || 'An error occurred while rescheduling your booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getFormattedTime = (timeValue) => {
    const allSlots = [...timeSlots.morning, ...timeSlots.afternoon, ...timeSlots.evening];
    const slot = allSlots.find(s => s.value === timeValue);
    return slot ? slot.label : timeValue;
  };

  // Check if a slot is booked
  const isSlotBooked = (slotValue) => {
    return bookedSlots.includes(slotValue);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Reschedule Appointment</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="mb-6 p-4 bg-blue-50 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900 text-lg">{booking.testName}</h3>
                <p className="text-sm text-gray-600 mt-1">{booking.location}</p>
                {booking.bookingFor && (
                  <p className="text-sm text-gray-700 mt-2">
                    <span className="font-medium">Booked for:</span> {booking.bookingFor}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Current Date & Time</p>
                <p className="font-semibold text-gray-900">
                  {formatDateTime(booking.date, booking.time)}
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg text-sm">
              Appointment rescheduled successfully!
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Date Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                <Calendar className="w-4 h-4 inline mr-2" />
                Select New Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={getMinDate()}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
              />
            </div>

            {/* Time Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                <Clock className="w-4 h-4 inline mr-2" />
                Select New Time
              </label>

              {selectedDate ? (
                <div className="space-y-4">
                  {/* Morning Slots */}
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Morning</h4>
                    <div className="grid grid-cols-3 gap-2">
                      {timeSlots.morning.map((slot) => (
                        <button
                          key={slot.value}
                          onClick={() => !isSlotBooked(slot.value) && !slot.isPast && setSelectedTime(slot.value)}
                          disabled={isSlotBooked(slot.value) || slot.isPast}
                          className={`px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${isSlotBooked(slot.value)
                            ? 'bg-red-100 text-red-800 border-red-200 cursor-not-allowed'
                            : slot.isPast
                              ? 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed'
                              : selectedTime === slot.value
                                ? 'bg-green-500 text-white border-green-500'
                                : 'bg-green-50 text-green-700 border-green-200 hover:border-green-500 hover:bg-green-100'
                            }`}
                        >
                          {slot.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Afternoon Slots */}
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Afternoon</h4>
                    <div className="grid grid-cols-3 gap-2">
                      {timeSlots.afternoon.map((slot) => (
                        <button
                          key={slot.value}
                          onClick={() => !isSlotBooked(slot.value) && !slot.isPast && setSelectedTime(slot.value)}
                          disabled={isSlotBooked(slot.value) || slot.isPast}
                          className={`px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${isSlotBooked(slot.value)
                            ? 'bg-red-100 text-red-800 border-red-200 cursor-not-allowed'
                            : slot.isPast
                              ? 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed'
                              : selectedTime === slot.value
                                ? 'bg-green-500 text-white border-green-500'
                                : 'bg-green-50 text-green-700 border-green-200 hover:border-green-500 hover:bg-green-100'
                            }`}
                        >
                          {slot.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Evening Slots */}
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Evening</h4>
                    <div className="grid grid-cols-3 gap-2">
                      {timeSlots.evening.map((slot) => (
                        <button
                          key={slot.value}
                          onClick={() => !isSlotBooked(slot.value) && !slot.isPast && setSelectedTime(slot.value)}
                          disabled={isSlotBooked(slot.value) || slot.isPast}
                          className={`px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${isSlotBooked(slot.value)
                            ? 'bg-red-100 text-red-800 border-red-200 cursor-not-allowed'
                            : slot.isPast
                              ? 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed'
                              : selectedTime === slot.value
                                ? 'bg-green-500 text-white border-green-500'
                                : 'bg-green-50 text-green-700 border-green-200 hover:border-green-500 hover:bg-green-100'
                            }`}
                        >
                          {slot.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-lg">
                  Please select a date to view available time slots
                </div>
              )}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-4 mt-4 text-sm">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-green-50 border border-green-200 rounded mr-2"></div>
              <span>Available</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-red-100 border border-red-200 rounded mr-2"></div>
              <span>Booked</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-gray-100 border border-gray-300 rounded mr-2"></div>
              <span>Past Time</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-8">
            <button
              onClick={onClose}
              className="flex-1 px-5 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={handleReschedule}
              className="flex-1 px-5 py-3 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
              disabled={loading || !selectedDate || !selectedTime}
            >
              {loading ? 'Rescheduling...' : 'Reschedule Appointment'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Reports Viewer Modal
const ReportsViewerModal = ({ isOpen, onClose, reports, testName }) => {
  const [isMerging, setIsMerging] = useState(false);

  if (!isOpen || !reports || reports.length === 0) return null;

  const downloadFile = (reportUrl, index) => {
    if (!reportUrl) return;

    let fileName = `Lab_Report_${index + 1}`;
    if (reportUrl.startsWith('data:')) {
      let extension = 'dat';
      if (reportUrl.includes('application/pdf')) extension = 'pdf';
      else if (reportUrl.includes('image/jpeg')) extension = 'jpg';
      else if (reportUrl.includes('image/png')) extension = 'png';
      fileName += `.${extension}`;

      const link = document.createElement('a');
      link.href = reportUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      window.open(reportUrl, '_blank');
    }
  };

  const downloadAll = async () => {
    if (reports.length === 0) return;

    setIsMerging(true);
    try {
      // Create a new PDF Document
      const mergedPdf = await PDFDocument.create();
      let hasAddedPages = false;

      for (const reportUrl of reports) {
        if (!reportUrl) continue;

        if (reportUrl.startsWith('data:image')) {
          // Handle Image
          try {
            // Fetch the image data
            const imageBytes = await fetch(reportUrl).then(res => res.arrayBuffer());
            let image;
            if (reportUrl.includes('image/png')) {
              image = await mergedPdf.embedPng(imageBytes);
            } else {
              // Assume JPEG for other image types
              image = await mergedPdf.embedJpg(imageBytes);
            }

            const page = mergedPdf.addPage();
            const { width, height } = image.scale(1);
            const pageWidth = page.getWidth();
            const pageHeight = page.getHeight();

            // Scale image to fit page with margin
            const margin = 40;
            const maxWidth = pageWidth - (margin * 2);
            const maxHeight = pageHeight - (margin * 2);

            let scale = 1;
            if (width > maxWidth || height > maxHeight) {
              scale = Math.min(maxWidth / width, maxHeight / height);
            }

            const scaledWidth = width * scale;
            const scaledHeight = height * scale;

            page.drawImage(image, {
              x: (pageWidth - scaledWidth) / 2,
              y: pageHeight - scaledHeight - margin,
              width: scaledWidth,
              height: scaledHeight,
            });
            hasAddedPages = true;
          } catch (e) {
            console.error("Error embedding image:", e);
          }
        } else if (reportUrl.includes('application/pdf')) {
          // Handle PDF
          try {
            // Extract base64
            const base64Data = reportUrl.includes('base64,') ? reportUrl.split('base64,')[1] : reportUrl;
            const srcPdf = await PDFDocument.load(base64Data);
            const copiedPages = await mergedPdf.copyPages(srcPdf, srcPdf.getPageIndices());
            copiedPages.forEach((page) => mergedPdf.addPage(page));
            hasAddedPages = true;
          } catch (e) {
            console.error("Error merging PDF:", e);
          }
        }
      }

      if (!hasAddedPages) {
        alert('No compatible pages found to merge.');
        return;
      }

      // Save and Download
      const pdfBytes = await mergedPdf.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);

      const now = new Date();
      const formattedDate = now.toISOString().slice(0, 10);
      const formattedTime = now.toTimeString().slice(0, 5).replace(':', '-');
      // Create a sanitized filename (e.g. "RD-Blood_Test_...pdf")
      // Replace spaces with underscores or hyphens generally preferred for filenames
      const sanitizedTestName = (testName || 'Report').replace(/[^a-zA-Z0-9-_ ]/g, '').trim().replace(/ /g, '_');

      link.download = `RD-${sanitizedTestName}_${formattedDate}_${formattedTime}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (error) {
      console.error('Error merging reports:', error);
      // Fallback
      alert('Could not merge some files. Downloading individually.');
      reports.forEach((url, idx) => {
        setTimeout(() => downloadFile(url, idx), idx * 500);
      });
    } finally {
      setIsMerging(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
          <h2 className="text-xl font-bold text-gray-800">Lab Reports ({reports.length})</h2>
          <div className="flex gap-2">
            {reports.length > 1 && (
              <button
                onClick={downloadAll}
                disabled={isMerging}
                className={`px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 flex items-center gap-1 ${isMerging ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {isMerging ? <Loader2 className="animate-spin" size={16} /> : <FileText size={16} />}
                {isMerging ? 'Merging...' : 'Download All as PDF'}
              </button>
            )}
            <button onClick={onClose} className="p-2 text-gray-500 hover:bg-gray-200 rounded-full transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-gray-100/50">
          {reports.map((url, idx) => {
            const isPdf = url.includes('application/pdf') || url.trim().endsWith('.pdf');
            return (
              <div key={idx} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="flex justify-between mb-3 border-b pb-2">
                  <span className="font-semibold text-gray-700">Report #{idx + 1}</span>
                  <button onClick={() => downloadFile(url, idx)} className="text-blue-600 hover:underline text-sm font-medium">Download</button>
                </div>
                <div className="w-full bg-gray-50 rounded-lg overflow-hidden border">
                  {isPdf ? (
                    <iframe src={url} className="w-full h-[500px]" title={`Report ${idx + 1}`}></iframe>
                  ) : (
                    <img src={url} alt={`Report ${idx + 1}`} className="w-full h-auto object-contain" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Payment Modal Component
const PaymentModal = ({ booking, isOpen, onClose, onSuccess }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('card');

  if (!isOpen || !booking) return null;

  const handlePay = async () => {
    setIsProcessing(true);

    // Simulate API processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    try {
      const response = await fetch('/api/bookings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: booking.bookingId || booking.id,
          updates: {
            paymentStatus: 'paid'
          }
        }),
      });

      const result = await safeJsonParse(response);

      if (result.success) {
        // Show success animation/state briefly
        setTimeout(() => {
          onSuccess(booking.id);
          onClose();
        }, 500);
      } else {
        alert('Payment failed. Please try again.');
      }
    } catch (error) {
      console.error('Payment Error:', error);
      alert('An error occurred processing your payment.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[60] p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden scale-100 transition-all">
        {/* Header */}
        <div className="bg-[#0052FF] p-6 text-white text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full blur-xl -ml-12 -mb-12"></div>

          <h3 className="text-xl font-bold relative z-10">Complete Payment</h3>
          <p className="text-blue-100 text-sm mt-1 relative z-10">Unlock your lab reports</p>

          <div className="mt-6 mb-2">
            <span className="text-4xl font-black tracking-tight relative z-10">{booking.price}</span>
          </div>
        </div>

        <div className="p-6">
          <div className="space-y-4 mb-8">
            <div className="flex items-center justify-between p-4 border border-blue-100 bg-blue-50/50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-blue-600 shadow-sm">
                  <FileText size={20} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-bold uppercase">Test Name</p>
                  <p className="font-bold text-gray-900 line-clamp-1">{booking.testName}</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-bold text-gray-700 block">Select Payment Method</label>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setPaymentMethod('card')} className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${paymentMethod === 'card' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:bg-gray-50'}`}>
                  <CreditCard size={24} />
                  <span className="text-xs font-bold">Credit Card</span>
                </button>
                <button onClick={() => setPaymentMethod('upi')} className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${paymentMethod === 'upi' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:bg-gray-50'}`}>
                  <Wallet size={24} />
                  <span className="text-xs font-bold">UPI / Wallet</span>
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={handlePay}
            disabled={isProcessing}
            className="w-full py-4 bg-[#0052FF] hover:bg-[#0040DD] text-white font-bold rounded-xl shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <>
                <Loader2 className="animate-spin" /> Processing...
              </>
            ) : (
              <>
                Pay Now <span className="opacity-80 ml-1">{booking.price}</span>
              </>
            )}
          </button>

          <button onClick={onClose} disabled={isProcessing} className="w-full mt-3 py-3 text-gray-500 font-semibold hover:bg-gray-50 rounded-xl transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

const UpcomingAppointments = () => {
  const [userName, setUserName] = useState('User')
  const [upcomingBookings, setUpcomingBookings] = useState([])
  const [pastBookings, setPastBookings] = useState([])
  const [cancelledBookings, setCancelledBookings] = useState([]) // New state for cancelled bookings
  const [copiedCodes, setCopiedCodes] = useState({}) // Track copied coupon codes
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showToast, setShowToast] = useState(false); // For showing toast message
  const [toastMessage, setToastMessage] = useState(''); // Toast message content
  const [activeTab, setActiveTab] = useState('upcoming'); // State for tab navigation
  const [showReportsViewer, setShowReportsViewer] = useState(false);
  const [selectedReports, setSelectedReports] = useState([]);
  const [selectedTestName, setSelectedTestName] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [bookingForPayment, setBookingForPayment] = useState(null);


  // Get user info and bookings from localStorage and database
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUserName = localStorage.getItem('userName') || 'User';
      setUserName(storedUserName);

      // Fetch bookings from database
      const fetchBookingsFromDB = async () => {
        if (typeof window !== 'undefined') {
          try {
            // Get user identification
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const userId = user.id;
            const storedPhone = localStorage.getItem('userPhone');
            const storedEmail = localStorage.getItem('userEmail');

            // Fetch bookings from API
            let url = '/api/bookings';
            const params = new URLSearchParams();

            if (userId) {
              params.append('userId', userId);
            } else if (storedPhone) {
              params.append('phone', storedPhone);
            } else if (storedEmail) {
              // The API doesn't currently support email filtering, but we could add it
              // For now, we'll rely on phone number
            }

            if (params.toString()) {
              url += `?${params.toString()}`;
            }

            const response = await fetch(url);

            if (response.ok) {
              const result = await safeJsonParse(response);

              if (result.success && result.bookings) {
                console.log(' bookings from database:', result.bookings);

                // Helper function to get price from booking (handles both single and multi-test)
                const getBookingPrice = (booking) => {
                  // If discount/final amount is available from vendor update, use that
                  if (booking.finalAmount !== undefined && booking.finalAmount !== null) {
                    return booking.finalAmount.toString();
                  }

                  // Check if this is a multi-test booking
                  if (booking.tests && Array.isArray(booking.tests) && booking.tests.length > 0) {
                    // Calculate total from tests array
                    const total = booking.tests.reduce((sum, test) => sum + (test.finalAmount !== undefined ? parseFloat(test.finalAmount) : (parseFloat(test.price) || 0)), 0);
                    return total.toString();
                  }
                  // Single test booking
                  return booking.price || '0';
                };

                // Helper function to get test name(s) from booking
                const getTestNames = (booking) => {
                  if (booking.tests && Array.isArray(booking.tests) && booking.tests.length > 0) {
                    return booking.tests.map(t => t.testName).join(', ');
                  }
                  return booking.testName || 'Unknown Test';
                };

                // Separate bookings based on status
                const upcoming = [];
                const past = [];
                const cancelled = [];

                result.bookings.forEach(booking => {
                  const status = booking.status ? booking.status.toLowerCase() : '';
                  const price = getBookingPrice(booking);
                  const testName = getTestNames(booking);
                  const priceFormatted = price.toString().startsWith('₹') ? price : `₹${price}`;

                  if (status === 'cancelled') {
                    cancelled.push({
                      id: booking._id,
                      bookingId: booking.bookingId,
                      testName: testName,
                      date: booking.appointmentDate,
                      time: booking.appointmentTime,
                      location: booking.labName,
                      address: booking.labAddress,
                      status: booking.status,
                      price: priceFormatted,
                      result: booking.result || null,
                      reports: booking.reports || [],
                      paymentStatus: booking.paymentStatus || 'pending',
                      cancellationReason: booking.cancellationReason || 'No reason provided',
                      bookingFor: booking.bookingFor,
                      isPackage: booking.isPackage || false,
                      tests: booking.tests || [] // Include tests array
                    });
                  } else if (status === 'completed') {
                    // All completed bookings go to past/completed tab
                    // regardless of payment status
                    past.push({
                      id: booking._id,
                      bookingId: booking.bookingId,
                      testName: testName,
                      date: booking.appointmentDate,
                      time: booking.appointmentTime,
                      location: booking.labName,
                      address: booking.labAddress,
                      status: booking.status,
                      price: priceFormatted,
                      result: booking.result || null,
                      reports: booking.reports || [],
                      paymentStatus: booking.paymentStatus || 'pending',
                      bookingFor: booking.bookingFor,
                      isPackage: booking.isPackage || false,
                      tests: booking.tests || [] // Include tests array
                    });
                  } else {
                    // Only confirmed and pending bookings are in upcoming
                    upcoming.push({
                      id: booking._id, // MongoDB ID
                      bookingId: booking.bookingId, // Booking ID from the document
                      testName: testName,
                      date: booking.appointmentDate,
                      time: booking.appointmentTime,
                      location: booking.labName,
                      address: booking.labAddress,
                      status: booking.status,
                      price: priceFormatted,
                      couponCode: booking.couponCode,
                      reports: booking.reports || [],
                      paymentStatus: booking.paymentStatus || 'pending',
                      bookingFor: booking.bookingFor,
                      patientDetails: booking.patientDetails,
                      createdAt: booking.createdAt,
                      isPackage: booking.isPackage || false,
                      tests: booking.tests || [] // Include tests array
                    });
                  }
                });

                console.log('Formatted bookings with addresses:', upcoming);
                setUpcomingBookings(upcoming);
                setPastBookings(past);
                setCancelledBookings(cancelled);
              } else {
                // No bookings found
                setUpcomingBookings([]);
                setPastBookings([]);
              }
            } else {
              console.error('Error fetching bookings from database:', response.status);
              // Don't fallback to localStorage to avoid showing sample data
              setUpcomingBookings([]);
              setPastBookings([]);
            }
          } catch (error) {
            console.error('Error fetching bookings from database:', error);
            // Don't fallback to localStorage to avoid showing sample data
            setUpcomingBookings([]);
            setPastBookings([]);
          }
        }
      };

      fetchBookingsFromDB();

      // Set up polling to refresh bookings every 30 seconds
      const intervalId = setInterval(fetchBookingsFromDB, 30000);

      // Clean up interval on component unmount
      return () => clearInterval(intervalId);
    }
  }, []);

  const handleCopyCode = (couponCode, e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(couponCode);

    // Show toast message
    setToastMessage('Copied to clipboard!');
    setShowToast(true);

    // Hide toast after 2 seconds
    setTimeout(() => {
      setShowToast(false);
    }, 2000);
  };

  const handleRescheduleClick = (booking) => {
    setSelectedBooking(booking);
    setShowRescheduleModal(true);
  };

  const handleCloseRescheduleModal = () => {
    setShowRescheduleModal(false);
    setSelectedBooking(null);
  };

  const handleRescheduleSuccess = () => {
    // Refresh bookings after successful reschedule
    const fetchBookingsFromDB = async () => {
      if (typeof window !== 'undefined') {
        try {
          // Get user identification
          const user = JSON.parse(localStorage.getItem('user') || '{}');
          const userId = user.id;
          const storedPhone = localStorage.getItem('userPhone');
          const storedEmail = localStorage.getItem('userEmail');

          // Fetch bookings from API
          let url = '/api/bookings';
          const params = new URLSearchParams();

          if (userId) {
            params.append('userId', userId);
          } else if (storedPhone) {
            params.append('phone', storedPhone);
          } else if (storedEmail) {
            // The API doesn't currently support email filtering, but we could add it
            // For now, we'll rely on phone number
          }

          if (params.toString()) {
            url += `?${params.toString()}`;
          }

          const response = await fetch(url);

          if (response.ok) {
            const result = await safeJsonParse(response);

            if (result.success && result.bookings) {
              // Helper function to get price from booking (handles both single and multi-test)
              const getBookingPrice = (booking) => {
                // If discount/final amount is available from vendor update, use that
                if (booking.finalAmount !== undefined && booking.finalAmount !== null) {
                  return booking.finalAmount.toString();
                }

                if (booking.tests && Array.isArray(booking.tests) && booking.tests.length > 0) {
                  const total = booking.tests.reduce((sum, test) => sum + (test.finalAmount !== undefined ? parseFloat(test.finalAmount) : (parseFloat(test.price) || 0)), 0);
                  return total.toString();
                }
                return booking.price || '0';
              };

              // Helper function to get test name(s) from booking
              const getTestNames = (booking) => {
                if (booking.tests && Array.isArray(booking.tests) && booking.tests.length > 0) {
                  return booking.tests.map(t => t.testName).join(', ');
                }
                return booking.testName || 'Unknown Test';
              };

              // Separate bookings based on status
              const upcoming = [];
              const past = [];
              const cancelled = [];

              result.bookings.forEach(booking => {
                const status = booking.status ? booking.status.toLowerCase() : '';
                const price = getBookingPrice(booking);
                const testName = getTestNames(booking);
                const priceFormatted = price.toString().startsWith('₹') ? price : `₹${price}`;

                if (status === 'cancelled') {
                  cancelled.push({
                    id: booking._id,
                    bookingId: booking.bookingId,
                    testName: testName,
                    date: booking.appointmentDate,
                    time: booking.appointmentTime,
                    location: booking.labName,
                    address: booking.labAddress,
                    status: booking.status,
                    price: priceFormatted,
                    result: booking.result || null,
                    reports: booking.reports || [],
                    paymentStatus: booking.paymentStatus || 'pending',
                    cancellationReason: booking.cancellationReason || 'No reason provided',
                    bookingFor: booking.bookingFor,
                    isPackage: booking.isPackage || false,
                    tests: booking.tests || []
                  });
                } else if (status === 'completed') {
                  // All completed bookings go to past/completed tab
                  // regardless of payment status
                  past.push({
                    id: booking._id,
                    bookingId: booking.bookingId,
                    testName: testName,
                    date: booking.appointmentDate,
                    time: booking.appointmentTime,
                    location: booking.labName,
                    address: booking.labAddress,
                    status: booking.status,
                    price: priceFormatted,
                    result: booking.result || null,
                    reports: booking.reports || [],
                    paymentStatus: booking.paymentStatus || 'pending',
                    bookingFor: booking.bookingFor,
                    isPackage: booking.isPackage || false,
                    tests: booking.tests || []
                  });
                } else {
                  // Only confirmed and pending bookings are in upcoming
                  upcoming.push({
                    id: booking._id, // MongoDB ID
                    bookingId: booking.bookingId, // Booking ID from the document
                    testName: testName,
                    date: booking.appointmentDate,
                    time: booking.appointmentTime,
                    location: booking.labName,
                    address: booking.labAddress,
                    status: booking.status,
                    price: priceFormatted,
                    couponCode: booking.couponCode,
                    reports: booking.reports || [],
                    paymentStatus: booking.paymentStatus || 'pending',
                    bookingFor: booking.bookingFor,
                    patientDetails: booking.patientDetails,
                    createdAt: booking.createdAt,
                    isPackage: booking.isPackage || false,
                    tests: booking.tests || []
                  });
                }
              });

              setUpcomingBookings(upcoming);
              setPastBookings(past);
              setCancelledBookings(cancelled);
            }
          }
        } catch (error) {
          console.error('Error refreshing bookings:', error);
        }
      }
    };

    fetchBookingsFromDB();
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const handleViewReport = (reports, testName) => {
    if (!reports) return;

    // Normalize to array
    const reportList = Array.isArray(reports) ? reports : [reports];

    if (reportList.length === 0) return;

    setSelectedReports(reportList);
    setSelectedTestName(testName || 'Report');
    setShowReportsViewer(true);
  };

  const handleOpenPayment = (booking) => {
    setBookingForPayment(booking);
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = (bookingId) => {
    // Optimistically update the local state to 'paid' so UI reflects change immediately
    const updateBookings = (list) => list.map(b =>
      (b.id === bookingId || b.bookingId === bookingId) ? { ...b, paymentStatus: 'paid' } : b
    );

    setPastBookings(prev => updateBookings(prev));
    setUpcomingBookings(prev => updateBookings(prev)); // unlikely but possible

    setToastMessage('Payment Successful! Reports Unlocked.');
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Custom Scrollbar Styles */}
      <style jsx global>{`
        .scrollbar-custom::-webkit-scrollbar {
          width: 8px;
        }
        
        .scrollbar-custom::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 10px;
          margin: 4px 0;
        }
        
        .scrollbar-custom::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #14b8a6 0%, #0d9488 100%);
          border-radius: 10px;
          transition: all 0.3s ease;
        }
        
        .scrollbar-custom::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, #0d9488 0%, #0f766e 100%);
          width: 10px;
        }
        
        /* Firefox scrollbar */
        .scrollbar-custom {
          scrollbar-width: thin;
          scrollbar-color: #14b8a6 #f1f5f9;
        }
        
        /* Smooth scrolling */
        .scrollbar-custom {
          scroll-behavior: smooth;
        }
      `}</style>
      <Navbar />
      {/* Toast Message */}
      {showToast && (
        <div className="fixed top-4 right-4 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-fadeIn">
          {toastMessage}
        </div>
      )}

      {/* Reschedule Modal */}
      {showRescheduleModal && selectedBooking && (
        <RescheduleModal
          booking={selectedBooking}
          onClose={handleCloseRescheduleModal}
          onReschedule={handleRescheduleSuccess}
        />
      )}
      <div className="flex-1 w-full bg-gray-50 px-4 md:px-8 py-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-[300px_1fr] gap-6">
          {/* Left Sidebar */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <div className="flex items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3 mb-4">
              <div className="flex-1">
                <div className="text-base font-bold text-gray-900">{userName}</div>
                <div className="text-xs text-gray-600 mt-1">User Dashboard</div>
                <div className="text-xs text-gray-600">Manage your appointments</div>
              </div>
            </div>

            <div className="space-y-2">
              <SidebarItem icon={<User className="w-5 h-5" />} label="Profile settings" href="/Patients/Dashboard" />
              <SidebarItem icon={<Calendar className="w-5 h-5" />} label="Upcoming Appointments" href="/Patients/Dashboard/upcoming" active />
              <SidebarItem icon={<Wallet className="w-5 h-5" />} label="Digital Wallet Balance" href="/Patients/Dashboard/wallet" />
              <SidebarItem icon={<Ticket className="w-5 h-5" />} label="Membership Packages" href="/Patients/Dashboard/membership" />
              <SidebarItem icon={<FileText className="w-5 h-5" />} label="Health history" href="/Patients/Dashboard/Healthhistory" />
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex">
            {/* Appointments List */}
            <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <div className="flex justify-between items-center mb-5">
                <h1 className="text-xl font-bold text-gray-900">My Bookings</h1>

                {/* Tab Navigation */}
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setActiveTab('upcoming')}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-300 ${activeTab === 'upcoming' ? 'bg-white shadow text-[#0052FF]' : 'text-gray-600 hover:text-gray-900'}`}
                  >
                    Upcoming ({Object.keys(upcomingBookings.reduce((groups, booking) => {
                      const key = booking.couponCode || booking.bookingId;
                      if (!groups[key]) groups[key] = [];
                      groups[key].push(booking);
                      return groups;
                    }, {})).length})
                  </button>
                  <button
                    onClick={() => setActiveTab('past')}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-300 ${activeTab === 'past' ? 'bg-white shadow text-[#0052FF]' : 'text-gray-600 hover:text-gray-900'}`}
                  >
                    Completed ({pastBookings.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('cancelled')}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-300 ${activeTab === 'cancelled' ? 'bg-white shadow text-[#0052FF]' : 'text-gray-600 hover:text-gray-900'}`}
                  >
                    Cancelled ({cancelledBookings.length})
                  </button>
                </div>
              </div>

              {/* Bookings Content with Smooth Transition */}
              <div className="transition-all duration-300 ease-in-out">
                {activeTab === 'upcoming' && (
                  <div className="mb-6 animate-fadeIn">
                    <h2 className="text-base font-semibold text-gray-800 mb-3">Upcoming Bookings</h2>
                    {upcomingBookings.length > 0 ? (
                      <div className="max-h-[320px] overflow-y-auto pr-2 space-y-3 scrollbar-custom">
                        {(() => {
                          // Group bookings by coupon code (tests booked together share same coupon)
                          const groupedBookings = upcomingBookings.reduce((groups, booking) => {
                            const key = booking.couponCode || booking.bookingId;
                            if (!groups[key]) {
                              groups[key] = [];
                            }
                            groups[key].push(booking);
                            return groups;
                          }, {});

                          // Convert grouped bookings to display format
                          const bookingGroups = Object.values(groupedBookings).map(bookings => {
                            // Use the first booking as base
                            const mainBooking = bookings[0];

                            // Calculate price range if multiple tests
                            let priceDisplay;
                            const testPrices = []; // Store test names with their prices

                            if (bookings.length > 1) {
                              // Extract all prices and create test-price pairs
                              const prices = bookings.map(b => {
                                const priceStr = b.price.replace('₹', '').trim();
                                const priceNum = parseFloat(priceStr) || 0;
                                testPrices.push({ testName: b.testName, price: priceNum, priceStr: b.price });
                                return priceNum;
                              });

                              const minPrice = Math.min(...prices);
                              const maxPrice = Math.max(...prices);
                              priceDisplay = minPrice === maxPrice ? `₹${minPrice}` : `₹${minPrice}-₹${maxPrice}`;
                            } else {
                              priceDisplay = mainBooking.price;
                              testPrices.push({
                                testName: mainBooking.testName,
                                price: parseFloat(mainBooking.price.replace('₹', '').trim()) || 0,
                                priceStr: mainBooking.price
                              });
                            }

                            return {
                              ...mainBooking,
                              allTestNames: bookings.map(b => b.testName),
                              allBookingIds: bookings.map(b => b.bookingId),
                              testPrices: testPrices, // Individual test prices
                              priceRange: priceDisplay,
                              isGrouped: bookings.length > 1
                            };
                          });

                          return bookingGroups.map((booking, index) => (
                            <div
                              key={index}
                              className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                            >
                              {/* Status Badge */}
                              <div className="flex items-center justify-between mb-4">
                                <div className="flex flex-wrap gap-2">
                                  <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold ${booking.status === 'Confirmed'
                                    ? 'bg-[#00CCFF] text-[#0052FF] border border-[#00A3FF]'
                                    : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                                    }`}>
                                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    {booking.status}
                                  </span>

                                  {/* {booking.paymentStatus === 'pending' && (
                                    <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
                                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                      Payment Pending
                                    </span>
                                  )} */}
                                </div>
                                <div className="text-right">
                                  {/* Removed price range display - showing individual test prices instead */}
                                  <div className="text-2xl font-bold text-[#0052FF]">
                                    {booking.isGrouped
                                      ? `₹${booking.testPrices.reduce((sum, test) => sum + test.price, 0).toFixed(2)}`
                                      : booking.price}
                                  </div>
                                </div>
                              </div>

                              {/* Test Name */}
                              <div className="mb-3">
                                {booking.isGrouped ? (
                                  <div>
                                    <div className="font-bold text-gray-600">Tests:</div>
                                    {/* Show individual test prices for grouped bookings */}
                                    <div className="mt-2 space-y-1">
                                      {booking.testPrices.map((test, idx) => (
                                        <div key={idx} className="flex justify-between text-sm">
                                          <span className="text-gray-600">{test.testName}</span>
                                          <span className="font-medium text-gray-900">{test.priceStr}</span>
                                        </div>
                                      ))}
                                    </div>
                                    {/* <p className="text-sm text-gray-500 mt-2">
                                      Total: ₹{booking.testPrices.reduce((sum, test) => sum + test.price, 0).toFixed(2)} ({booking.allTestNames.length} tests)
                                    </p> */}
                                  </div>
                                ) : (
                                  <>
                                    <h3 className="text-lg font-bold text-gray-900">
                                      {booking.testName}
                                      {booking.isPackage && (
                                        <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                          Package
                                        </span>
                                      )}
                                    </h3>
                                    {booking.tests && booking.tests.map((testItem, idx) => (
                                      testItem.packageTests && testItem.packageTests.length > 0 && (
                                        <div key={idx} className="mt-2 pl-3 border-l-2 border-blue-100">
                                          <p className="text-xs font-medium text-gray-500 mb-1">Includes:</p>
                                          <ul className="text-sm text-gray-600 space-y-0.5">
                                            {testItem.packageTests.map((pt, i) => (
                                              <li key={i}>• {pt}</li>
                                            ))}
                                          </ul>
                                        </div>
                                      )
                                    ))}
                                  </>
                                )}
                              </div>

                              {/* Lab Name */}
                              <p className="text-sm text-gray-600 mb-4">{booking.location}</p>

                              {/* Booking Details Grid */}
                              <div className="space-y-2.5 mb-4">
                                <div className="flex items-center text-gray-700">
                                  <CalendarDays className="w-4 h-4 mr-3 text-gray-500 flex-shrink-0" />
                                  <span className="text-sm font-medium">{formatDate(booking.date)}</span>
                                </div>
                                <div className="flex items-center text-gray-700">
                                  <Clock className="w-4 h-4 mr-3 text-gray-500 flex-shrink-0" />
                                  <span className="text-sm font-medium">{booking.time}</span>
                                </div>
                                <div className="flex items-center text-gray-700">
                                  <MapPin className="w-4 h-4 mr-3 text-gray-500 flex-shrink-0" />
                                  <span className="text-sm font-medium">{booking.address || booking.location}</span>
                                </div>
                                {booking.bookingFor && (
                                  <div className="flex items-center text-gray-700">
                                    <User className="w-4 h-4 mr-3 text-gray-500 flex-shrink-0" />
                                    <div>
                                      <span className="text-xs text-gray-500">Booked for: </span>
                                      <span className="text-sm font-semibold text-gray-900">{booking.bookingFor}</span>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Promo Code and Actions */}
                              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                                {booking.couponCode && booking.couponCode !== 'N/A' ? (
                                  <div className="flex items-center gap-2 bg-[#00CCFF] px-3 py-2 rounded-lg border border-[#00A3FF]">
                                    <Ticket className="w-4 h-4 text-[#0052FF] flex-shrink-0" />
                                    <div className="flex flex-col">
                                      <span className="text-xs text-[#0052FF] font-medium">Promo Code</span>
                                      <span className="text-sm font-bold text-[#0052FF]">{booking.couponCode}</span>
                                    </div>
                                    <button
                                      onClick={(e) => handleCopyCode(booking.couponCode, e)}
                                      className="ml-2 p-1.5 text-[#0052FF] hover:text-[#0052FF] hover:bg-[#00CCFF] rounded transition-colors"
                                      title="Copy coupon code"
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                      </svg>
                                    </button>
                                  </div>
                                ) : (
                                  <div></div>
                                )}
                                <div className="flex gap-2">
                                  {booking.reports && booking.reports.length > 0 && (
                                    <button
                                      onClick={() => {
                                        if (booking.paymentStatus === 'paid') {
                                          handleViewReport(booking.reports);
                                        }
                                      }}
                                      disabled={booking.paymentStatus === 'pending'}
                                      className={`flex items-center gap-2 text-sm font-medium transition-colors px-3 py-2 rounded-lg ${booking.paymentStatus === 'paid'
                                        ? 'text-blue-600 hover:text-blue-800 hover:bg-blue-50'
                                        : 'text-gray-400 cursor-not-allowed bg-gray-50'
                                        }`}
                                      title={booking.paymentStatus === 'pending' ? 'Complete payment to view reports' : 'View test reports'}
                                    >
                                      <FileText className="w-4 h-4" />
                                      <span>Reports</span>
                                    </button>
                                  )}
                                  {booking.address && booking.address.trim() !== '' && (
                                    <button
                                      onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(booking.address)}`, '_blank')}
                                      className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-[#0052FF] transition-colors px-3 py-2 rounded-lg hover:bg-gray-50"
                                      title="Get directions to lab"
                                    >
                                      <MapPin className="w-4 h-4" />
                                      <span>Directions</span>
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleRescheduleClick(booking)}
                                    className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-[#0052FF] transition-colors px-3 py-2 rounded-lg hover:bg-gray-50"
                                    title="Reschedule appointment"
                                  >
                                    <RotateCcw className="w-4 h-4" />
                                    <span>Reschedule</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          ));

                        })()}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">No upcoming bookings</p>
                    )}
                  </div>
                )}

                {activeTab === 'past' && (
                  <div className="mb-6 animate-fadeIn">
                    <h2 className="text-base font-semibold text-gray-800 mb-3">Completed Bookings</h2>
                    {pastBookings.length > 0 ? (
                      <div className="max-h-[320px] overflow-y-auto pr-2 space-y-3 scrollbar-custom">
                        {pastBookings.map((booking) => (
                          <div
                            key={booking.id}
                            className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                          >
                            {/* Status Badge */}
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex flex-wrap gap-2">
                                <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold ${booking.status && booking.status.toLowerCase() === 'completed'
                                  ? 'bg-green-50 text-green-700 border border-green-200'
                                  : 'bg-blue-50 text-blue-700 border border-blue-200'
                                  }`}>
                                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                  </svg>
                                  {booking.status && booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                                </span>

                                {booking.paymentStatus === 'pending' && (
                                  <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Payment Pending
                                  </span>
                                )}
                                {booking.paymentStatus === 'paid' && (
                                  <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
                                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    Paid
                                  </span>
                                )}
                              </div>
                              <div className="text-right">
                                <div className="text-2xl font-bold text-green-600">{booking.price}</div>
                              </div>
                            </div>

                            {/* Test Name */}
                            <div className="mb-3">
                              <h3 className="text-lg font-bold text-gray-900">
                                {booking.testName}
                                {booking.isPackage && (
                                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    Package
                                  </span>
                                )}
                              </h3>
                            </div>

                            {/* Lab Name */}
                            <p className="text-sm text-gray-600 mb-4">{booking.location}</p>

                            {/* Booking Details */}
                            <div className="space-y-2.5 mb-4">
                              <div className="flex items-center text-gray-700">
                                <CalendarDays className="w-4 h-4 mr-3 text-gray-500 flex-shrink-0" />
                                <span className="text-sm font-medium">{formatDate(booking.date)}</span>
                              </div>
                              <div className="flex items-center text-gray-700">
                                <Clock className="w-4 h-4 mr-3 text-gray-500 flex-shrink-0" />
                                <span className="text-sm font-medium">{booking.time}</span>
                              </div>
                              <div className="flex items-center text-gray-700">
                                <MapPin className="w-4 h-4 mr-3 text-gray-500 flex-shrink-0" />
                                <span className="text-sm font-medium">{booking.address || booking.location}</span>
                              </div>
                              {booking.bookingFor && (
                                <div className="flex items-center text-gray-700">
                                  <User className="w-4 h-4 mr-3 text-gray-500 flex-shrink-0" />
                                  <div>
                                    <span className="text-xs text-gray-500">Booked for: </span>
                                    <span className="text-sm font-semibold text-gray-900">{booking.bookingFor}</span>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Reports Logic for Past/Completed Bookings */}
                            {booking.status && booking.status.toLowerCase() === 'completed' && booking.reports && booking.reports.length > 0 && (
                              <div className="pt-3 border-t border-gray-100 mt-2">
                                {booking.paymentStatus === 'pending' ? (
                                  <button
                                    onClick={() => handleOpenPayment(booking)}
                                    className="w-full flex items-center justify-center gap-2 text-sm font-bold text-white bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 shadow-md transition-all px-4 py-3 rounded-xl transform active:scale-95"
                                  >
                                    <Lock className="w-4 h-4" />
                                    <span>Pay {booking.price} to View Reports</span>
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleViewReport(booking.reports, booking.testName)}
                                    className="w-full flex items-center justify-center gap-2 text-sm font-bold text-white bg-[#0052FF] hover:bg-[#0040DD] shadow-md transition-all px-4 py-3 rounded-xl transform active:scale-95"
                                  >
                                    <FileText className="w-4 h-4" />
                                    <span>View Reports</span>
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">No past bookings</p>
                    )}
                  </div>
                )}

                {activeTab === 'cancelled' && (
                  <div className="mb-6 animate-fadeIn">
                    <h2 className="text-base font-semibold text-gray-800 mb-3">Cancelled Bookings</h2>
                    {cancelledBookings.length > 0 ? (
                      <div className="max-h-[320px] overflow-y-auto pr-2 space-y-3 scrollbar-custom">
                        {cancelledBookings.map((booking) => (
                          <div
                            key={booking.id}
                            className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                          >
                            {/* Status Badge */}
                            <div className="flex items-center justify-between mb-4">
                              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
                                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                                Cancelled
                              </span>
                              <div className="text-right">
                                <div className="text-2xl font-bold text-red-600">{booking.price}</div>
                              </div>
                            </div>

                            {/* Test Name */}
                            <div className="mb-3">
                              <h3 className="text-lg font-bold text-gray-900">
                                {booking.testName}
                                {booking.isPackage && (
                                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    Package
                                  </span>
                                )}
                              </h3>
                            </div>

                            {/* Lab Name */}
                            <p className="text-sm text-gray-600 mb-4">{booking.location}</p>

                            {/* Booking Details */}
                            <div className="space-y-2.5 mb-4">
                              <div className="flex items-center text-gray-700">
                                <CalendarDays className="w-4 h-4 mr-3 text-gray-500 flex-shrink-0" />
                                <span className="text-sm font-medium">{formatDate(booking.date)}</span>
                              </div>
                              <div className="flex items-center text-gray-700">
                                <Clock className="w-4 h-4 mr-3 text-gray-500 flex-shrink-0" />
                                <span className="text-sm font-medium">{booking.time}</span>
                              </div>
                              <div className="flex items-center text-gray-700">
                                <MapPin className="w-4 h-4 mr-3 text-gray-500 flex-shrink-0" />
                                <span className="text-sm font-medium">{booking.address || booking.location}</span>
                              </div>
                              {booking.bookingFor && (
                                <div className="flex items-center text-gray-700">
                                  <User className="w-4 h-4 mr-3 text-gray-500 flex-shrink-0" />
                                  <div>
                                    <span className="text-xs text-gray-500">Booked for: </span>
                                    <span className="text-sm font-semibold text-gray-900">{booking.bookingFor}</span>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Cancellation Reason */}
                            <div className="pt-3 border-t border-gray-100 mb-3">
                              <div className="flex items-start gap-2">
                                <FileText className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
                                <div>
                                  <p className="text-xs text-gray-500 font-medium mb-1">Cancellation Reason:</p>
                                  <p className="text-sm text-gray-700">{booking.cancellationReason || 'No reason provided'}</p>
                                </div>
                              </div>
                            </div>

                            {/* Reschedule Button */}
                            <div className="pt-3 border-t border-gray-100">
                              <button
                                onClick={() => handleRescheduleClick(booking)}
                                className="w-full flex items-center justify-center gap-2 text-sm font-medium text-white bg-[#0052FF] hover:bg-[#0052FF] transition-colors px-4 py-2.5 rounded-lg"
                                title="Reschedule appointment"
                              >
                                <RotateCcw className="w-4 h-4" />
                                <span>Reschedule Appointment</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">No cancelled bookings</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <ReportsViewerModal
        isOpen={showReportsViewer}
        onClose={() => setShowReportsViewer(false)}
        reports={selectedReports}
        testName={selectedTestName}
      />

      {showRescheduleModal && selectedBooking && (
        <RescheduleModal
          booking={selectedBooking}
          onClose={handleCloseRescheduleModal}
          onReschedule={handleRescheduleSuccess}
        />
      )}

      {showPaymentModal && bookingForPayment && (
        <PaymentModal
          booking={bookingForPayment}
          isOpen={showPaymentModal}
          onClose={() => { setShowPaymentModal(false); setBookingForPayment(null); }}
          onSuccess={handlePaymentSuccess}
        />
      )}

      <Footer />
    </div>
  );
};

export default UpcomingAppointments