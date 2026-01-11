'use client';
import { useState, useEffect, useMemo } from 'react';
import { FiCalendar, FiChevronDown, FiDownload, FiFilter, FiTrendingUp, FiActivity, FiDollarSign, FiBarChart2, FiCopy } from 'react-icons/fi';
import { Bar, Line, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export default function Analytics() {
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState('monthly');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [vendorId, setVendorId] = useState(null);
  const [labName, setLabName] = useState('');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedCoupon, setCopiedCoupon] = useState(null);
  const [selectedMonths, setSelectedMonths] = useState([]); // Array to store multiple selected months
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Get vendor details and fetch bookings from database only
  useEffect(() => {
    const fetchVendorData = async () => {
      try {
        // Fetch current vendor data from API
        const vendorResponse = await fetch('/api/current-vendor');

        // Check if response is OK
        if (!vendorResponse.ok) {
          console.error('Vendor API response not OK:', vendorResponse.status, vendorResponse.statusText);
          setBookings([]);
          setLoading(false);
          return;
        }

        // Check if response is JSON
        const vendorContentType = vendorResponse.headers.get("content-type");
        if (!vendorContentType || !vendorContentType.includes("application/json")) {
          console.error('Vendor response is not JSON:', vendorContentType);
          setBookings([]);
          setLoading(false);
          return;
        }

        // Parse vendor JSON data with error handling
        let vendorData;
        try {
          vendorData = await vendorResponse.json();
        } catch (parseError) {
          console.error('Error parsing vendor JSON:', parseError);
          setBookings([]);
          setLoading(false);
          return;
        }

        if (vendorData.success && vendorData.vendor) {
          const vendor = vendorData.vendor;
          setVendorId(vendor._id);
          setLabName(vendor.labName || vendor.username);

          // Fetch bookings for analytics - only for current vendor's lab
          // FIX: Use labName parameter instead of vendorId
          const bookingsResponse = await fetch(`/api/bookings?labName=${encodeURIComponent(vendor.labName)}`);

          // Check if response is OK
          if (!bookingsResponse.ok) {
            console.error('Bookings API response not OK:', bookingsResponse.status, bookingsResponse.statusText);
            setBookings([]);
            setLoading(false);
            return;
          }

          // Check if response is JSON
          const bookingsContentType = bookingsResponse.headers.get("content-type");
          if (!bookingsContentType || !bookingsContentType.includes("application/json")) {
            console.error('Bookings response is not JSON:', bookingsContentType);
            setBookings([]);
            setLoading(false);
            return;
          }

          // Parse bookings JSON data with error handling
          let bookingsData;
          try {
            bookingsData = await bookingsResponse.json();
          } catch (parseError) {
            console.error('Error parsing bookings JSON:', parseError);
            setBookings([]);
            setLoading(false);
            return;
          }

          if (bookingsData.success && bookingsData.bookings) {
            setBookings(bookingsData.bookings);
          }
        }
      } catch (error) {
        console.error('Error fetching vendor data:', error);
        setBookings([]);
      } finally {
        setLoading(false);
      }
    };

    fetchVendorData();
  }, []);

  // Toggle month selection
  const toggleMonthSelection = (year, monthIndex) => {
    const monthKey = `${year}-${monthIndex}`;
    if (selectedMonths.includes(monthKey)) {
      // If already selected, remove it
      setSelectedMonths(prev => prev.filter(m => m !== monthKey));
    } else {
      // If not selected, add it
      setSelectedMonths(prev => [...prev, monthKey]);
    }
  };

  // Filter bookings based on selected months and exclude cancelled bookings
  const filteredBookings = useMemo(() => {
    // First filter out cancelled bookings
    const activeBookings = bookings.filter(booking =>
      booking.status && booking.status.toLowerCase() !== 'cancelled'
    );

    if (selectedMonths.length === 0) {
      // If no months selected, show last 30 days by default
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      return activeBookings.filter(booking => {
        const bookingDate = new Date(booking.appointmentDate);
        return bookingDate >= thirtyDaysAgo;
      });
    }

    // Filter by selected months
    return activeBookings.filter(booking => {
      const bookingDate = new Date(booking.appointmentDate);
      const bookingMonthKey = `${bookingDate.getFullYear()}-${bookingDate.getMonth()}`;
      return selectedMonths.includes(bookingMonthKey);
    });
  }, [bookings, selectedMonths]);

  // Get recent bookings (last 3) from filtered bookings
  const recentBookings = useMemo(() => {
    return filteredBookings
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 3)
      .map(booking => {
        // Check if this is a multi-test booking
        const isMultiTest = booking.tests && Array.isArray(booking.tests) && booking.tests.length > 0;

        if (isMultiTest) {
          const allTestNames = booking.tests.map(t => t.testName).join(', ');
          const totalAmount = booking.tests.reduce((sum, t) => sum + (parseFloat(t.price) || 0), 0);

          return {
            id: booking.bookingId,
            patient: booking.patientDetails.patientName || 'Unknown',
            test: allTestNames,
            date: booking.appointmentDate,
            amount: `₹${totalAmount}`,
            status: booking.status,
            couponCode: booking.couponCode || 'N/A'
          };
        } else {
          return {
            id: booking.bookingId,
            patient: booking.patientDetails.patientName || 'Unknown',
            test: booking.testName,
            date: booking.appointmentDate,
            amount: `₹${booking.price}`,
            status: booking.status,
            couponCode: booking.couponCode || 'N/A'
          };
        }
      });
  }, [filteredBookings]);

  // Calculate stats from filtered bookings
  const calculateStats = useMemo(() => {
    let totalRevenue = 0;
    let totalTests = 0;

    filteredBookings.forEach(booking => {
      // Check if this is a multi-test booking
      const isMultiTest = booking.tests && Array.isArray(booking.tests) && booking.tests.length > 0;

      if (isMultiTest) {
        // For multi-test bookings, sum all test prices
        const bookingTotal = booking.tests.reduce((sum, t) => sum + (parseFloat(t.price) || 0), 0);
        totalRevenue += bookingTotal;
        totalTests += booking.tests.length; // Count each test separately
      } else {
        // For single test bookings
        totalRevenue += parseFloat(booking.price) || 0;
        totalTests += 1;
      }
    });

    const avgTestCost = totalTests > 0 ? totalRevenue / totalTests : 0;

    return {
      totalRevenue,
      totalTests,
      avgTestCost
    };
  }, [filteredBookings]);

  const stats = loading ? [] : [
    { name: 'Total Revenue', value: `₹${calculateStats.totalRevenue.toLocaleString()}`, icon: FiDollarSign },
    { name: 'Total Tests', value: calculateStats.totalTests.toString(), icon: FiActivity },
    { name: 'Avg. Test Cost', value: `₹${Math.round(calculateStats.avgTestCost).toLocaleString()}`, icon: FiTrendingUp },
  ];

  // Prepare data for charts using filtered bookings data
  const getRevenueData = useMemo(() => {
    // Group bookings by month for revenue chart
    const monthlyRevenue = {};

    filteredBookings.forEach(booking => {
      const date = new Date(booking.appointmentDate);
      const month = date.toLocaleString('default', { month: 'short' });
      const year = date.getFullYear();
      const key = `${month} ${year}`;

      if (!monthlyRevenue[key]) {
        monthlyRevenue[key] = 0;
      }

      // Check if this is a multi-test booking
      const isMultiTest = booking.tests && Array.isArray(booking.tests) && booking.tests.length > 0;

      if (isMultiTest) {
        // For multi-test bookings, sum all test prices
        const bookingTotal = booking.tests.reduce((sum, t) => sum + (parseFloat(t.price) || 0), 0);
        monthlyRevenue[key] += bookingTotal;
      } else {
        monthlyRevenue[key] += parseFloat(booking.price) || 0;
      }
    });

    const labels = Object.keys(monthlyRevenue);
    const data = Object.values(monthlyRevenue);

    return {
      labels,
      datasets: [
        {
          label: 'Revenue',
          data,
          backgroundColor: 'rgba(59, 130, 246, 0.7)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 2,
          tension: 0.4,
          fill: true
        }
      ]
    };
  }, [filteredBookings]);

  const getTestDistributionData = useMemo(() => {
    // Count tests by organ for distribution chart
    const organCount = {};

    filteredBookings.forEach(booking => {
      // Check if this is a multi-test booking
      const isMultiTest = booking.tests && Array.isArray(booking.tests) && booking.tests.length > 0;

      if (isMultiTest) {
        // For multi-test bookings, count each test's organ separately
        booking.tests.forEach(test => {
          const organ = test.organ || 'Unknown';
          if (!organCount[organ]) {
            organCount[organ] = 0;
          }
          organCount[organ]++;
        });
      } else {
        const organ = booking.organ || 'Unknown';
        if (!organCount[organ]) {
          organCount[organ] = 0;
        }
        organCount[organ]++;
      }
    });

    const labels = Object.keys(organCount);
    const data = Object.values(organCount);

    // Define colors for different organs
    const backgroundColors = [
      'rgba(59, 130, 246, 0.8)',
      'rgba(16, 185, 129, 0.8)',
      'rgba(249, 115, 22, 0.8)',
      'rgba(139, 92, 246, 0.8)',
      'rgba(236, 72, 153, 0.8)',
      'rgba(20, 184, 166, 0.8)',
      'rgba(245, 158, 11, 0.8)',
      'rgba(124, 58, 237, 0.8)'
    ];

    // Repeat colors if we have more organs than colors
    const colors = labels.map((_, index) => backgroundColors[index % backgroundColors.length]);

    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor: colors,
          borderColor: colors.map(color => color.replace('0.8', '1')),
          borderWidth: 1
        }
      ]
    };
  }, [filteredBookings]);

  // Get test distribution summary for the list view
  const distributionSummary = useMemo(() => {
    const distributionData = getTestDistributionData;
    return distributionData.labels.map((label, index) => ({
      organ: label,
      count: distributionData.datasets[0].data[index],
      color: distributionData.datasets[0].backgroundColor[index]
    }));
  }, [getTestDistributionData]);

  // Format months for display
  const formatSelectedMonths = () => {
    if (selectedMonths.length === 0) {
      return 'Last 30 days';
    } else if (selectedMonths.length === 1) {
      const [year, monthIndex] = selectedMonths[0].split('-').map(Number);
      return new Date(year, monthIndex).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } else {
      return `${selectedMonths.length} months selected`;
    }
  };

  // Reset to default view
  const resetFilters = () => {
    setSelectedMonths([]);
    setShowDatePicker(false);
  };

  // Navigate to previous year
  const goToPreviousYear = () => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      newDate.setFullYear(newDate.getFullYear() - 1);
      return newDate;
    });
  };

  // Navigate to next year
  const goToNextYear = () => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      newDate.setFullYear(newDate.getFullYear() + 1);
      return newDate;
    });
  };

  // Generate months for selection
  const generateMonths = () => {
    const year = currentMonth.getFullYear();
    const months = [];

    for (let i = 0; i < 12; i++) {
      months.push({ year, monthIndex: i });
    }

    return months;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
      {/* Success Toast Message */}
      {copiedCoupon && (
        <div className="fixed top-4 right-4 z-50">
          <div className="bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <span>Copied to clipboard!</span>
          </div>
        </div>
      )}

      {loading ? (
        <div className="min-h-screen flex items-center justify-center bg-white">
          <div className="flex flex-col items-center gap-4">
            {/* Simple neat spinner */}
            <div className="w-6 h-6 rounded-full border-[2px] border-slate-100 border-t-slate-800 animate-spin"></div>
            <p className="text-[10px] font-bold tracking-widest uppercase text-slate-400">Loading analytics</p>
          </div>
        </div>
      ) : (
        <>
          {/* Header with Tabs */}
          <div className="mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
                <p className="text-gray-600 mt-2">Welcome back, {labName || 'Vendor'}. View your lab's performance metrics and insights.</p>
              </div>
              <div className="flex items-center space-x-3 mt-4 md:mt-0">
                <div className="relative">
                  <button
                    onClick={() => setShowDatePicker(!showDatePicker)}
                    className="flex items-center px-4 py-2.5 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200"
                  >
                    <FiCalendar className="mr-2 text-gray-600" />
                    <span className="font-medium text-gray-700">
                      {formatSelectedMonths()}
                    </span>
                    <FiChevronDown className="ml-2 text-gray-500" />
                  </button>
                  {showDatePicker && (
                    <div className="absolute right-0 mt-2 w-72 bg-white border border-gray-200 rounded-xl shadow-xl z-10 overflow-hidden">
                      <div className="p-5">
                        <div className="flex justify-between items-center mb-4">
                          <button
                            onClick={goToPreviousYear}
                            className="p-1 rounded-full hover:bg-gray-100"
                          >
                            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
                            </svg>
                          </button>
                          <h3 className="font-medium text-gray-900">
                            {currentMonth.getFullYear()}
                          </h3>
                          <button
                            onClick={goToNextYear}
                            className="p-1 rounded-full hover:bg-gray-100"
                          >
                            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                            </svg>
                          </button>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          {generateMonths().map(({ year, monthIndex }) => {
                            const monthKey = `${year}-${monthIndex}`;
                            const isSelected = selectedMonths.includes(monthKey);
                            return (
                              <button
                                key={monthKey}
                                onClick={() => toggleMonthSelection(year, monthIndex)}
                                className={`px-3 py-2 text-sm rounded-lg transition-colors duration-150 ${isSelected
                                  ? 'bg-blue-500 text-white'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                  }`}
                              >
                                {new Date(year, monthIndex).toLocaleDateString('en-US', { month: 'short' })}
                              </button>
                            );
                          })}
                        </div>
                        <div className="mt-4 flex justify-between">
                          <button
                            onClick={resetFilters}
                            className="text-sm text-gray-600 hover:text-gray-900"
                          >
                            Reset
                          </button>
                          <div className="text-xs text-gray-500">
                            {selectedMonths.length > 0
                              ? `${selectedMonths.length} month${selectedMonths.length > 1 ? 's' : ''} selected`
                              : 'Select months'}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {stats.map((stat, index) => (
              <div key={index} className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow duration-300">
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                    </div>
                    <div className={`${stat.color} p-3 rounded-xl`}>
                      <stat.icon className="h-8 w-8 text-white" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Revenue Trend Section - Cleaned Up */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-50 rounded-lg mr-3">
                  <FiBarChart2 className="text-blue-500" size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Revenue Trend</h3>
                  <p className="text-sm text-gray-500">
                    {formatSelectedMonths()}
                  </p>
                </div>
              </div>
              <div className="bg-blue-50 px-4 py-2 rounded-lg">
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-xl font-bold text-gray-900">
                  ₹{calculateStats.totalRevenue.toLocaleString()}
                </p>
              </div>
            </div>
            <div className="h-72">
              <Line
                data={getRevenueData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false,
                    },
                    tooltip: {
                      mode: 'index',
                      intersect: false,
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      titleColor: '#1e293b',
                      bodyColor: '#334155',
                      borderColor: '#e2e8f0',
                      borderWidth: 1,
                      padding: 12,
                      callbacks: {
                        label: function (context) {
                          return `Revenue: ₹${context.parsed.y.toLocaleString()}`;
                        }
                      }
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      grid: {
                        drawBorder: false,
                        color: '#f1f5f9'
                      },
                      ticks: {
                        callback: function (value) {
                          if (value >= 1000) {
                            return '₹' + (value / 1000).toFixed(0) + 'k';
                          }
                          return '₹' + value;
                        },
                        color: '#94a3b8'
                      }
                    },
                    x: {
                      grid: {
                        display: false,
                      },
                      ticks: {
                        color: '#94a3b8'
                      }
                    },
                  },
                  elements: {
                    point: {
                      radius: 4,
                      hoverRadius: 6,
                      backgroundColor: '#3b82f6',
                      borderColor: '#fff',
                      borderWidth: 2
                    },
                    line: {
                      tension: 0.3,
                      borderWidth: 3
                    }
                  }
                }}
              />
            </div>
          </div>

          {/* Recent Bookings */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow duration-300">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Recent Bookings</h3>
              <button className="text-sm font-medium text-blue-600 hover:text-blue-800">
                View All
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Booking ID
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Patient
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Test
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Coupon Code
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {recentBookings.length > 0 ? (
                    recentBookings.map((booking) => (
                      <tr key={booking.id} className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {booking.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {booking.patient}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {booking.test}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {booking.date}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                          {booking.amount}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          <div className="flex items-center">
                            {booking.couponCode}
                            {booking.couponCode !== 'N/A' && (
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(booking.couponCode);
                                  setCopiedCoupon(booking.id);
                                  setTimeout(() => setCopiedCoupon(null), 2000);
                                }}
                                className="ml-2 text-gray-500 hover:text-blue-600"
                                title="Copy coupon code"
                              >
                                <FiCopy size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${booking.status === 'Completed'
                            ? 'bg-green-100 text-green-800'
                            : booking.status === 'Confirmed'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                            }`}>
                            {booking.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="px-6 py-12 text-center text-sm text-gray-500">
                        <div className="flex flex-col items-center justify-center">
                          <FiActivity className="h-12 w-12 text-gray-300 mb-3" />
                          <span>No recent bookings</span>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}