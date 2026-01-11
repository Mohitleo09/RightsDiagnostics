'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { MapPin, Calendar, Clock, CheckCircle, Copy, ClipboardList, User, ChevronRight, ChevronLeft, ShieldCheck, Activity, CreditCard } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';
import Navbar from '../../page';
import Footer from '../../Footer/page';
import { safeJsonParse } from '../../../utils/apiUtils';

function BookAtThisLab() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [bookingData, setBookingData] = useState({
    testName: '',
    testId: '',
    labName: '',
    labAddress: '',
    labRating: '4.5',
    price: '290',
    organ: '',
    description: ''
  });

  // Date and Time State
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [bookedSlots, setBookedSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [lockingSlot, setLockingSlot] = useState(null);

  const [isLoading, setIsLoading] = useState(true);
  const [bookingFor, setBookingFor] = useState('self');
  const [patientDetails, setPatientDetails] = useState({
    contactNumber: '',
    email: '',
    specialInstructions: '',
    patientName: '',
    age: '',
    relation: ''
  });
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [bookingId, setBookingId] = useState('');
  const [couponCode, setCouponCode] = useState('');

  // Load user data
  useEffect(() => {
    if (bookingFor === 'self' && typeof window !== 'undefined') {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      setPatientDetails(prev => ({
        ...prev,
        contactNumber: user.phone || user.contactNumber || '',
        email: localStorage.getItem('userEmail') || user.email || '',
        patientName: user.name || user.username || '',
        age: user.age || '',
        relation: 'self'
      }));
    } else if (bookingFor === 'family') {
      setPatientDetails(prev => ({
        ...prev,
        contactNumber: '',
        email: '',
        patientName: '',
        age: '',
        relation: ''
      }));
    }
  }, [bookingFor]);

  // Load params
  useEffect(() => {
    const testName = searchParams.get('testName') || 'Test Name';
    const testId = searchParams.get('testId') || '';
    const labName = searchParams.get('labName') || 'Lab Name';
    const labAddress = searchParams.get('labAddress') || 'Lab Address';
    const labRating = searchParams.get('labRating') || '4.5';
    const price = searchParams.get('price') || '0';

    const fetchTestDetails = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/tests');
        const data = await response.json();

        if (data.success && data.tests) {
          const test = data.tests.find(t => t._id === testId || t.testName === testName);
          if (test) {
            setBookingData({
              testName: test.testName || testName,
              testId: test._id || testId,
              labName,
              labAddress,
              labRating,
              price,
              organ: test.organ || 'General Test',
              description: test.description || '',
              actualPrice: test.actualPrice || ''
            });
          } else {
            setBookingData({ testName, testId, labName, labAddress, labRating, price, organ: 'General Test', description: '', actualPrice: '' });
          }
        }
        setIsLoading(false);
      } catch (error) {
        setBookingData({ testName, testId, labName, labAddress, labRating, price, organ: 'General Test', description: '', actualPrice: '' });
        setIsLoading(false);
      }
    };
    fetchTestDetails();
  }, [searchParams]);

  // Logic: Time Slots
  const generateTimeSlots = useCallback(() => {
    const slots = { morning: [], afternoon: [], evening: [] };
    const now = new Date();
    const currentDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    for (let hour = 8; hour <= 19; hour++) {
      for (let min = 0; min < 60; min += 30) {
        if (hour === 20 && min > 0) break;
        const time24 = `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
        if (time24 === '13:00' || time24 === '13:30' || time24 === '16:30') continue;

        const hour12 = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const time12 = `${hour12}:${String(min).padStart(2, '0')} ${ampm}`;
        const isPast = selectedDate === currentDate && time24 < currentTime;

        if (hour >= 8 && hour < 12) slots.morning.push({ value: time24, label: time12, isPast });
        else if (hour >= 12 && hour < 17) slots.afternoon.push({ value: time24, label: time12, isPast });
        else slots.evening.push({ value: time24, label: time12, isPast });
      }
    }
    return slots;
  }, [selectedDate]);

  const timeSlots = generateTimeSlots();

  const fetchBookedSlots = useCallback(async () => {
    if (selectedDate && bookingData.labName) {
      setLoadingSlots(true);
      try {
        const response = await fetch('/api/check-slot-availability', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            labName: bookingData.labName,
            appointmentDate: selectedDate,
            getAllSlots: true
          }),
        });
        if (!response.ok) return;
        const data = await safeJsonParse(response);
        if (data.success && data.bookedSlots) setBookedSlots(data.bookedSlots);
      } catch (error) { console.error(error); }
      finally { setLoadingSlots(false); }
    } else { setBookedSlots([]); }
  }, [selectedDate, bookingData.labName]);

  useEffect(() => { fetchBookedSlots(); }, [fetchBookedSlots]);

  const handleSlotSelection = async (timeValue) => {
    if (!selectedDate) return alert("Please select a date first.");
    setLockingSlot(timeValue);
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = user.id || user.email || 'guest-' + Date.now();
      const res = await fetch('/api/lock-slot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ labName: bookingData.labName, appointmentDate: selectedDate, appointmentTime: timeValue, userId }),
      });
      const data = await res.json();
      if (data.success) setSelectedTime(timeValue);
      else { alert(data.error); fetchBookedSlots(); }
    } catch (error) { alert('Failed to select slot.'); }
    finally { setLockingSlot(null); }
  };

  const handleConfirmBooking = async () => {
    const newBookingId = `RL-${Date.now()}${Math.floor(Math.random() * 1000)}`.slice(0, 15);
    const newCouponCode = Math.random().toString(36).substring(2, 7).toUpperCase();
    setBookingId(newBookingId);
    setCouponCode(newCouponCode);

    const newBooking = {
      bookingId: newBookingId,
      couponCode: newCouponCode,
      testName: bookingData.testName,
      organ: Array.isArray(bookingData.organ) ? bookingData.organ.join(', ') : bookingData.organ,
      price: bookingData.price,
      labName: bookingData.labName,
      labAddress: bookingData.labAddress,
      labRating: bookingData.labRating,
      appointmentDate: selectedDate,
      appointmentTime: selectedTime,
      formattedTime: getFormattedTime(),
      bookingFor: bookingFor,
      patientDetails,
      status: 'Confirmed',
    };

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBooking),
      });
      const result = await res.json();
      if (result.success) {
        setBookingConfirmed(true);
        // Save Local
        const localBooking = { ...newBooking, createdAt: new Date().toISOString() };
        const existingBookings = JSON.parse(localStorage.getItem('upcomingBookings') || '[]');
        existingBookings.unshift(localBooking);
        localStorage.setItem('upcomingBookings', JSON.stringify(existingBookings));
        // Save Vendor
        const vendorBooking = {
          id: newBookingId, patient: patientDetails.patientName || 'Unknown', phone: patientDetails.contactNumber,
          test: bookingData.testName, date: selectedDate, time: getFormattedTime(), amount: parseFloat(bookingData.price),
          status: 'confirmed', location: bookingData.labName, bookingDate: new Date().toISOString().split('T')[0],
          couponCode: newCouponCode, organ: newBooking.organ,
          bookingFor: bookingFor, email: patientDetails.email, specialInstructions: patientDetails.specialInstructions,
          ...(bookingFor === 'family' && { age: patientDetails.age, relation: patientDetails.relation })
        };
        const existingVendor = JSON.parse(localStorage.getItem('vendorBookings') || '[]');
        existingVendor.unshift(vendorBooking);
        localStorage.setItem('vendorBookings', JSON.stringify(existingVendor));
      } else alert('Failed to save booking.');
    } catch (error) { alert('An error occurred.'); }
  };

  const getFormattedTime = () => {
    const all = [...timeSlots.morning, ...timeSlots.afternoon, ...timeSlots.evening];
    const s = all.find(s => s.value === selectedTime);
    return s ? s.label : selectedTime;
  };
  const getMinDate = () => new Date().toISOString().split('T')[0];

  // Helper UI Components
  const StepIndicator = ({ step, label, current }) => {
    const isActive = current === step;
    const isPast = current > step || (step === 4 && bookingConfirmed);
    return (
      <div className="flex items-center gap-2">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 border
                ${isActive ? 'bg-blue-600 text-white border-blue-600 shadow-blue-200' :
            isPast ? 'bg-green-500 text-white border-green-500' : 'bg-transparent text-slate-400 border-slate-200'}`}>
          {isPast ? <CheckCircle className="w-4 h-4" /> : step}
        </div>
        <span className={`text-sm font-medium ${isActive ? 'text-slate-900' : 'text-slate-400'}`}>{label}</span>
      </div>
    )
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans selection:bg-blue-100">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 lg:px-8 py-12 relative">
        {/* Background Decorations */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-100/50 rounded-full blur-3xl -z-10 opacity-60"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-100/50 rounded-full blur-3xl -z-10 opacity-60"></div>

        {/* Header Section */}
        <div className="mb-12 text-center max-w-2xl mx-auto">
          <h1 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight mb-4">
            {bookingConfirmed ? 'Booking Confirmed' : 'Secure Your Appointment'}
          </h1>
          <p className="text-slate-500 text-lg">
            {bookingConfirmed ? 'Everything is set! You can find your booking details below.' : 'Complete the steps below to schedule your diagnostic test.'}
          </p>
        </div>

        {/* Stepper (Only show if not confirmed) */}
        {!bookingConfirmed && (
          <div className="flex justify-center mb-12">
            <div className="flex items-center gap-4 lg:gap-12 bg-white px-8 py-4 rounded-full shadow-sm border border-slate-100 overflow-x-auto max-w-full">
              <StepIndicator step={1} label="Verify" current={currentStep} />
              <div className="w-8 h-px bg-slate-200 hidden sm:block"></div>
              <StepIndicator step={2} label="Schedule" current={currentStep} />
              <div className="w-8 h-px bg-slate-200 hidden sm:block"></div>
              <StepIndicator step={3} label="Details" current={currentStep} />
              <div className="w-8 h-px bg-slate-200 hidden sm:block"></div>
              <StepIndicator step={4} label="Confirm" current={currentStep} />
            </div>
          </div>
        )}

        {/* content Card */}
        <div className="max-w-4xl mx-auto bg-white/80 backdrop-blur-xl rounded-3xl border border-white shadow-2xl overflow-hidden transition-all duration-500">

          {/* Step 1: Verification */}
          {currentStep === 1 && !isLoading && (
            <div className="p-8 lg:p-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Verify Selection</h2>
                  <p className="text-slate-500">Double check your test and lab details.</p>
                </div>
              </div>

              <div className="grid lg:grid-cols-2 gap-6 mb-8">
                <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:border-blue-200 transition-colors group">
                  <div className="text-xs font-bold text-blue-500 uppercase tracking-widest mb-2">Test Selected</div>
                  <h3 className="text-xl font-bold text-slate-900 mb-1 group-hover:text-blue-600 transition-colors">{bookingData.testName}</h3>
                  <p className="text-slate-500 text-sm mb-4">{bookingData.organ} Test</p>
                  <div className="text-2xl font-black text-slate-900">₹{bookingData.price}</div>
                </div>

                <div className="p-6 rounded-2xl bg-indigo-50/50 border border-indigo-100 hover:border-indigo-200 transition-colors">
                  <div className="text-xs font-bold text-indigo-500 uppercase tracking-widest mb-2">Lab Location</div>
                  <h3 className="text-xl font-bold text-slate-900 mb-1">{bookingData.labName}</h3>
                  <div className="flex items-start gap-2 mt-3 text-slate-600 text-sm">
                    <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-indigo-500" />
                    {bookingData.labAddress}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                <button onClick={() => router.back()} className="px-6 py-3 rounded-xl text-slate-600 hover:bg-slate-50 font-semibold transition-colors">Cancel</button>
                <button onClick={() => setCurrentStep(2)} className="px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-500/30 transition-all hover:scale-[1.02] active:scale-95 flex items-center gap-2">
                  Confirm & Continue <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Scheduling */}
          {currentStep === 2 && (
            <div className="p-8 lg:p-12 animate-in fade-in slide-in-from-right-8 duration-500">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Choose a Slot</h2>
                  <p className="text-slate-500">Select a convenient date and time for your visit.</p>
                </div>
              </div>

              <div className="flex flex-col lg:flex-row gap-8 mb-8">
                {/* Date Picker */}
                <div className="flex-1">
                  <label className="block text-sm font-bold text-slate-700 mb-3 ml-1">SELECT DATE</label>
                  <div className="relative">
                    <input type="date" value={selectedDate} min={getMinDate()} onChange={e => setSelectedDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-slate-900 font-bold focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all" />
                  </div>
                </div>

                {/* Selected Summary */}
                <div className="flex-1 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white text-center flex flex-col justify-center shadow-lg shadow-blue-500/20">
                  <div className="text-blue-100 text-sm font-medium uppercase tracking-wider mb-1">Your Appointment</div>
                  {selectedDate && selectedTime ? (
                    <>
                      <div className="text-2xl font-bold">{new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' })}</div>
                      <div className="text-lg opacity-90">{timeSlots.morning.find(s => s.value === selectedTime)?.label || timeSlots.afternoon.find(s => s.value === selectedTime)?.label || timeSlots.evening.find(s => s.value === selectedTime)?.label}</div>
                    </>
                  ) : (
                    <div className="text-lg font-medium opacity-70">Select date & time</div>
                  )}
                </div>
              </div>

              {/* Time Slots */}
              <div className="space-y-8">
                {['Morning', 'Afternoon', 'Evening'].map((period) => {
                  const pKey = period.toLowerCase();
                  if (timeSlots[pKey].length === 0) return null;
                  return (
                    <div key={period}>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-2 h-2 rounded-full bg-slate-300"></div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{period} Slots</span>
                        <div className="h-px bg-slate-100 flex-1"></div>
                      </div>
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                        {timeSlots[pKey].map((slot) => {
                          const isSelected = selectedTime === slot.value;
                          const isBooked = bookedSlots.includes(slot.value);
                          const isPast = slot.isPast;
                          return (
                            <button key={slot.value} onClick={() => !isBooked && !isPast && handleSlotSelection(slot.value)} disabled={isBooked || isPast || lockingSlot !== null}
                              className={`relative px-2 py-3 rounded-xl text-sm font-bold border transition-all duration-200 overflow-hidden
                                                        ${isSelected ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/30 scale-105 z-10' :
                                  isBooked || isPast ? 'bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed' :
                                    'bg-white border-slate-200 text-slate-600 hover:border-blue-400 hover:text-blue-600'}`}>
                              {loadingSlots || lockingSlot === slot.value ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mx-auto" /> : slot.label}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="flex justify-between pt-8 mt-8 border-t border-slate-100">
                <button onClick={() => setCurrentStep(1)} className="px-6 py-3 rounded-xl text-slate-600 hover:bg-slate-50 font-semibold transition-colors flex items-center gap-2"><ChevronLeft className="w-4 h-4" /> Back</button>
                <button onClick={() => { if (!selectedDate || !selectedTime) return alert('Select date & time'); setCurrentStep(3); }}
                  className="px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-500/30 transition-all hover:scale-[1.02] active:scale-95 flex items-center gap-2">
                  Continue <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Details */}
          {currentStep === 3 && (
            <div className="p-8 lg:p-12 animate-in fade-in slide-in-from-right-8 duration-500">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Patient Details</h2>
                  <p className="text-slate-500">Who is this booking for?</p>
                </div>
              </div>

              <div className="bg-slate-50 p-6 rounded-2xl mb-8 flex gap-4">
                <button onClick={() => setBookingFor('self')} className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all shadow-sm border ${bookingFor === 'self' ? 'bg-white text-blue-600 border-blue-200 ring-2 ring-blue-50' : 'bg-transparent text-slate-500 border-transparent hover:bg-white/50'}`}>Myself</button>
                <button onClick={() => setBookingFor('family')} className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all shadow-sm border ${bookingFor === 'family' ? 'bg-white text-blue-600 border-blue-200 ring-2 ring-blue-50' : 'bg-transparent text-slate-500 border-transparent hover:bg-white/50'}`}>Family Member</button>
              </div>

              <div className="space-y-5">
                {bookingFor === 'family' && (
                  <div className="grid md:grid-cols-2 gap-5">
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase ml-1 mb-2 block">Patient Name</label>
                      <input type="text" placeholder="Full Name" value={patientDetails.patientName} onChange={e => setPatientDetails({ ...patientDetails, patientName: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-semibold focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-slate-500 uppercase ml-1 mb-2 block">Age</label>
                        <input type="number" placeholder="Years" value={patientDetails.age} onChange={e => setPatientDetails({ ...patientDetails, age: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-semibold focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-500 uppercase ml-1 mb-2 block">Relation</label>
                        <select value={patientDetails.relation} onChange={e => setPatientDetails({ ...patientDetails, relation: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-semibold focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none">
                          <option value="">Select</option>
                          <option value="spouse">Spouse</option>
                          <option value="parent">Parent</option>
                          <option value="child">Child</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-5">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1 mb-2 block">Contact Number</label>
                    <input type="tel" maxLength="10" placeholder="10-digit number" value={patientDetails.contactNumber} onChange={e => setPatientDetails({ ...patientDetails, contactNumber: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-semibold focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1 mb-2 block">Email Address</label>
                    <input type="email" placeholder="example@email.com" value={patientDetails.email} onChange={e => setPatientDetails({ ...patientDetails, email: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-semibold focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none" />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1 mb-2 block">Special Instructions (Optional)</label>
                  <textarea rows="3" placeholder="Any requests for the lab?" value={patientDetails.specialInstructions} onChange={e => setPatientDetails({ ...patientDetails, specialInstructions: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-semibold focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none resize-none" />
                </div>
              </div>

              <div className="flex justify-between pt-8 mt-8 border-t border-slate-100">
                <button onClick={() => setCurrentStep(2)} className="px-6 py-3 rounded-xl text-slate-600 hover:bg-slate-50 font-semibold transition-colors flex items-center gap-2"><ChevronLeft className="w-4 h-4" /> Back</button>
                <button onClick={() => { if (!patientDetails.contactNumber || !patientDetails.email) return alert('Fill required fields'); setCurrentStep(4); }}
                  className="px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-500/30 transition-all hover:scale-[1.02] active:scale-95 flex items-center gap-2">
                  Review & Pay <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Confirm */}
          {currentStep === 4 && !bookingConfirmed && (
            <div className="p-8 lg:p-12 animate-in fade-in slide-in-from-right-8 duration-500">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-green-600">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Final Review</h2>
                  <p className="text-slate-500">Review your booking before confirming.</p>
                </div>
              </div>

              <div className="bg-slate-50 rounded-3xl p-6 lg:p-8 mb-8 border border-slate-100">
                <div className="flex flex-col gap-6">
                  <div className="flex justify-between items-start pb-6 border-b border-slate-200">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">{bookingData.testName}</h3>
                      <p className="text-slate-500 text-sm">{bookingData.organ} Test</p>
                    </div>
                    <div className="text-xl font-black text-slate-900">₹{bookingData.price}</div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-6">
                    <div>
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Appointment</div>
                      <div className="font-bold text-slate-800 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-blue-500" />
                        {new Date(selectedDate).toLocaleDateString()}
                      </div>
                      <div className="font-bold text-slate-800 flex items-center gap-2 mt-1">
                        <Clock className="w-4 h-4 text-blue-500" />
                        {getFormattedTime()}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Lab Details</div>
                      <div className="font-bold text-slate-800">{bookingData.labName}</div>
                      <div className="text-sm text-slate-500">{bookingData.labAddress}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-2">
                <button onClick={() => setCurrentStep(3)} className="px-6 py-3 rounded-xl text-slate-600 hover:bg-slate-50 font-semibold transition-colors flex items-center gap-2"><ChevronLeft className="w-4 h-4" /> Back</button>
                <button onClick={handleConfirmBooking} className="px-10 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold shadow-xl shadow-blue-500/40 transition-all hover:scale-[1.02] active:scale-95 flex items-center gap-2 text-lg">
                  Confirm Booking
                </button>
              </div>
            </div>
          )}

          {/* Success State */}
          {bookingConfirmed && (
            <div className="p-6 md:p-12 animate-in zoom-in-95 duration-500">
              {/* Header Section */}
              <div className="text-center mb-10">
                <div className="mb-6 relative inline-block">
                  <div className="w-24 h-24 bg-gradient-to-tr from-[#2ecc71] to-[#27ae60] rounded-full flex items-center justify-center shadow-lg shadow-green-200 mx-auto animate-bounce-slow">
                    <CheckCircle className="w-12 h-12 text-white" />
                  </div>
                  <div className="absolute -inset-4 bg-green-100 rounded-full -z-10 animate-pulse opacity-50"></div>
                </div>

                <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">Booking Confirmed!</h2>
                <p className="text-gray-500 text-lg max-w-md mx-auto">
                  Thank you for choosing RightsLab. Your appointment has been successfully scheduled.
                </p>
              </div>

              <div className="space-y-8 max-w-2xl mx-auto">
                {/* Coupon Code Card */}
                <div className="bg-gradient-to-br from-[#007AFF] to-[#0052FF] rounded-2xl p-8 text-white shadow-xl shadow-blue-200 relative overflow-hidden group">
                  {/* Glass Effect Overlay */}
                  <div className="absolute inset-0 bg-white opacity-10 group-hover:opacity-20 transition-opacity duration-500"></div>
                  {/* Circle Decorations */}
                  <div className="absolute -top-10 -right-10 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>
                  <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-white opacity-10 rounded-full blur-xl"></div>

                  <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="text-center md:text-left">
                      <p className="text-blue-100 text-sm font-bold uppercase tracking-widest mb-1">Exclusive Coupon</p>
                      <h3 className="text-3xl font-bold tracking-tight text-white mb-2">{couponCode}</h3>
                      <p className="text-blue-100 text-sm opacity-90">Present this code at the lab for direct discounts.</p>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(couponCode);
                        alert('Coupon code copied to clipboard!');
                      }}
                      className="px-6 py-3 bg-white text-[#007AFF] rounded-xl font-bold shadow-lg hover:shadow-xl hover:bg-gray-50 transition-all transform hover:-translate-y-1 active:scale-95 flex items-center gap-2 group/btn"
                    >
                      <Copy className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                      Copy Code
                    </button>
                  </div>
                </div>

                {/* Booking Details Grid - Digital Ticket Style */}
                <div className="bg-white rounded-3xl overflow-hidden shadow-2xl shadow-gray-200 border border-gray-100 relative">
                  {/* Ticket Header (Blue Strip) */}
                  <div className="bg-[#007AFF] px-8 py-6 flex items-center justify-between relative overflow-hidden">
                    <div className="relative z-10 text-white">
                      <h3 className="text-xl font-bold tracking-tight mb-1">Booking Confirmation</h3>
                      <p className="text-blue-100 text-sm font-medium opacity-90">Thank you for choosing RightsLab</p>
                    </div>
                    <div className="bg-white/10 p-2 rounded-lg backdrop-blur-sm relative z-10">
                      <div className="text-center">
                        <span className="block text-[10px] text-blue-100 font-bold uppercase tracking-wider mb-1">Booking ID</span>
                        <span className="block text-sm font-mono font-bold text-white tracking-widest">{bookingId}</span>
                      </div>
                    </div>
                    {/* Decorative Circles */}
                    <div className="absolute -right-6 -top-6 w-24 h-24 bg-white opacity-10 rounded-full blur-xl"></div>
                    <div className="absolute -left-6 -bottom-6 w-20 h-20 bg-white opacity-10 rounded-full blur-xl"></div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12">
                    {/* Left Side: Ticket Body */}
                    <div className="lg:col-span-7 xl:col-span-7 p-6 md:p-8 bg-gray-50 border-r border-gray-200 dashed-border relative">
                      <div className="space-y-6">
                        {/* Date & Time Block */}
                        <div className="flex gap-4">
                          <div className="flex-1 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                            <p className="text-xs text-gray-500 font-bold uppercase tracking-wide mb-1">Date</p>
                            <p className="text-lg font-bold text-gray-900 leading-none">
                              {selectedDate && new Date(selectedDate).toLocaleDateString('en-US', { day: '2-digit', month: 'short' })}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">{selectedDate && new Date(selectedDate).getFullYear()}</p>
                          </div>
                          <div className="flex-1 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                            <p className="text-xs text-gray-500 font-bold uppercase tracking-wide mb-1">Time</p>
                            <p className="text-lg font-bold text-gray-900 leading-none">
                              {getFormattedTime()}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">Scheduled</p>
                          </div>
                        </div>

                        {/* Details List */}
                        <div className="space-y-5">
                          <div className="relative pl-4 border-l-2 border-gray-200">
                            <div className="absolute -left-[5px] top-0 w-2 h-2 rounded-full bg-gray-300"></div>
                            <p className="text-xs text-gray-500 font-bold uppercase tracking-wide mb-1">Lab Location</p>
                            <p className="font-bold text-gray-900">{bookingData.labName}</p>
                            <p className="text-sm text-gray-500 mt-0.5 leading-relaxed">{bookingData.labAddress}</p>
                          </div>

                          <div className="relative pl-4 border-l-2 border-gray-200">
                            <div className="absolute -left-[5px] top-0 w-2 h-2 rounded-full bg-gray-300"></div>
                            <p className="text-xs text-gray-500 font-bold uppercase tracking-wide mb-1">Patient</p>
                            <p className="font-bold text-gray-900">{bookingFor === 'self' ? 'Myself' : patientDetails.patientName}</p>
                            <p className="text-sm text-gray-500 mt-0.5">{patientDetails.contactNumber}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Side: Receipt Summary */}
                    <div className="lg:col-span-5 xl:col-span-5 p-6 md:p-8 bg-white relative flex flex-col justify-between">
                      <div>
                        <div className="mb-6 pb-6 border-b border-gray-100">
                          <h4 className="text-lg font-bold text-gray-900 mb-4">Summary</h4>
                          <div className="flex justify-between items-start group">
                            <div className="flex-1 pr-4">
                              <p className="text-sm font-bold text-gray-900 group-hover:text-[#007AFF] transition-colors">{bookingData.testName}</p>
                              <p className="text-xs text-gray-500 mt-0.5">{bookingData.organ} Test</p>
                            </div>
                            <span className="text-xl font-black text-[#007AFF]">₹{bookingData.price}</span>
                          </div>
                        </div>

                        {/* Footer Status */}
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                            <CheckCircle className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Status</p>
                            <p className="text-sm font-bold text-green-600">Confirmed</p>
                          </div>
                        </div>

                        <div className="mt-4 text-right">
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-0.5">Confirmed On</p>
                          <p className="text-sm font-bold text-gray-900">
                            {new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-center gap-4 mt-8">
                <button onClick={() => router.push('/Patients/Dashboard/upcoming')} className="px-6 py-3 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold rounded-xl transition-colors min-w-[140px]">My Bookings</button>
                <button onClick={() => router.push('/')} className="px-6 py-3 bg-[#007AFF] hover:bg-[#0052FF] text-white font-bold rounded-xl shadow-lg shadow-blue-200 transition-all hover:translate-y-0.5 min-w-[140px]">Go Home</button>
              </div>
            </div>
          )}

        </div>

      </main>
      <Footer />
    </div>
  );
}

export default BookAtThisLab;
