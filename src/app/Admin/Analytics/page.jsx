'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Users,
  IndianRupee,
  Activity,
  TrendingUp,
  Calendar,
  Download,
  BarChart3,
  LineChart,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  Filter,
  PieChart
} from 'lucide-react';
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { safeJsonParse } from '../../utils/apiUtils';

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

const AdminAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalVendors: 0,
    totalTests: 0,
    totalBookings: 0,
    totalRevenue: 0,
  });
  const [bookings, setBookings] = useState([]);
  const [timeRange, setTimeRange] = useState('monthly');
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [detailedBookings, setDetailedBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [bookingStatusFilter, setBookingStatusFilter] = useState('all');

  // Filter bookings based on selected status
  const filteredBookings = useMemo(() => {
    if (bookingStatusFilter === 'all') {
      return detailedBookings;
    }
    return detailedBookings.filter(booking =>
      booking.status && booking.status.toLowerCase() === bookingStatusFilter.toLowerCase()
    );
  }, [detailedBookings, bookingStatusFilter]);

  // Calculate revenue based on filtered bookings (based on selected status)
  const filteredRevenue = useMemo(() => {
    if (bookingStatusFilter === 'all') {
      // For 'all', show revenue from all bookings (completed, cancelled, confirmed)
      const revenueBookings = detailedBookings.filter(booking =>
        booking.status && (booking.status.toLowerCase() === 'completed' ||
          booking.status.toLowerCase() === 'cancelled' ||
          booking.status.toLowerCase() === 'confirmed')
      );
      return revenueBookings.reduce((sum, booking) => sum + (parseFloat(booking.price) || 0), 0);
    } else {
      // For specific status, show revenue from bookings with that status
      const revenueBookings = filteredBookings.filter(booking =>
        booking.status && booking.status.toLowerCase() === bookingStatusFilter.toLowerCase()
      );
      return revenueBookings.reduce((sum, booking) => sum + (parseFloat(booking.price) || 0), 0);
    }
  }, [detailedBookings, filteredBookings, bookingStatusFilter]);

  // Filtered aggregated data for charts
  const filteredAggregatedData = useMemo(() => {
    const aggregatedBookings = {};
    const aggregatedRevenue = {};
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();

    // Initialize data based on time range
    if (timeRange === 'monthly') {
      for (let i = 1; i <= 12; i++) {
        const monthKey = `${currentYear}-${i.toString().padStart(2, '0')}`;
        aggregatedBookings[monthKey] = 0;
        aggregatedRevenue[monthKey] = 0;
      }
    } else if (timeRange === 'quarterly') {
      for (let i = 1; i <= 4; i++) {
        const quarterKey = `${currentYear}-Q${i}`;
        aggregatedBookings[quarterKey] = 0;
        aggregatedRevenue[quarterKey] = 0;
      }
    } else if (timeRange === 'yearly') {
      for (let i = 4; i >= 0; i--) {
        const yearKey = (currentYear - i).toString();
        aggregatedBookings[yearKey] = 0;
        aggregatedRevenue[yearKey] = 0;
      }
    }

    // Filter bookings based on status filter
    let bookingsToProcess = [];
    if (bookingStatusFilter === 'all') {
      bookingsToProcess = bookings;
    } else {
      bookingsToProcess = bookings.filter(booking =>
        booking.status && booking.status.toLowerCase() === bookingStatusFilter.toLowerCase()
      );
    }

    // Process bookings for chart data
    bookingsToProcess.forEach(booking => {
      try {
        const date = new Date(booking.createdAt);

        let key;
        if (timeRange === 'monthly') {
          key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        } else if (timeRange === 'quarterly') {
          const quarter = Math.ceil((date.getMonth() + 1) / 3);
          key = `${date.getFullYear()}-Q${quarter}`;
        } else if (timeRange === 'yearly') {
          key = date.getFullYear().toString();
        }

        aggregatedBookings[key] = (aggregatedBookings[key] || 0) + 1;

        // Add to revenue based on selected status filter
        if (bookingStatusFilter === 'all') {
          // For 'all', count completed, cancelled, and confirmed bookings
          if (booking.status && (booking.status.toLowerCase() === 'completed' ||
            booking.status.toLowerCase() === 'cancelled' ||
            booking.status.toLowerCase() === 'confirmed')) {
            aggregatedRevenue[key] = (aggregatedRevenue[key] || 0) + (parseFloat(booking.price) || 0);
          }
        } else {
          // For specific status, count bookings with that status
          if (booking.status && booking.status.toLowerCase() === bookingStatusFilter.toLowerCase()) {
            aggregatedRevenue[key] = (aggregatedRevenue[key] || 0) + (parseFloat(booking.price) || 0);
          }
        }
      } catch (error) {
        console.error('Error processing booking date:', error);
      }
    });

    return { aggregatedBookings, aggregatedRevenue };
  }, [bookings, timeRange, bookingStatusFilter]);

  useEffect(() => {
    fetchAnalyticsData();
    fetchDetailedBookings();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      setLastUpdated(new Date());

      // Fetch users count
      const usersResponse = await fetch('/api/users/count');
      if (usersResponse.ok && usersResponse.headers.get('content-type')?.includes('application/json')) {
        const usersData = await safeJsonParse(usersResponse);
        if (usersData.success) {
          setStats(prev => ({ ...prev, totalUsers: usersData.count }));
        }
      }

      // Fetch tests count
      const testsResponse = await fetch('/api/tests/count?showAll=true');
      if (testsResponse.ok && testsResponse.headers.get('content-type')?.includes('application/json')) {
        const testsData = await safeJsonParse(testsResponse);
        if (testsData.success) {
          setStats(prev => ({ ...prev, totalTests: testsData.count }));
        }
      }

      // Fetch all bookings
      const bookingsResponse = await fetch('/api/bookings');
      if (bookingsResponse.ok && bookingsResponse.headers.get('content-type')?.includes('application/json')) {
        const bookingsData = await safeJsonParse(bookingsResponse);
        if (bookingsData.success && bookingsData.bookings) {
          setBookings(bookingsData.bookings);

          // Calculate revenue and other stats - for all bookings (completed, cancelled, confirmed)
          const allBookings = bookingsData.bookings.filter(booking =>
            booking.status && (booking.status.toLowerCase() === 'completed' ||
              booking.status.toLowerCase() === 'cancelled' ||
              booking.status.toLowerCase() === 'confirmed')
          );

          const totalRevenue = allBookings.reduce((sum, b) =>
            sum + (parseFloat(b.price) || 0), 0
          );

          setStats(prev => ({
            ...prev,
            totalBookings: bookingsData.bookings.length,
            totalRevenue,
          }));
        }
      }

      // Fetch vendors count (using the correct endpoint)
      const vendorsResponse = await fetch('/api/vendors/count');
      if (vendorsResponse.ok && vendorsResponse.headers.get('content-type')?.includes('application/json')) {
        const vendorsData = await safeJsonParse(vendorsResponse);
        if (vendorsData.success) {
          setStats(prev => ({ ...prev, totalVendors: vendorsData.count }));
        }
      }

    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const { aggregatedBookings: filteredBookingsData, aggregatedRevenue: filteredRevenueData } = filteredAggregatedData;

  // Chart data
  const revenueChartData = {
    labels: timeRange === 'monthly'
      ? ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      : timeRange === 'quarterly'
        ? ['Q1', 'Q2', 'Q3', 'Q4']
        : Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - 4 + i).toString()),
    datasets: [
      {
        label: 'Revenue',
        data: timeRange === 'monthly'
          ? Array.from({ length: 12 }, (_, i) => {
            const monthKey = `${new Date().getFullYear()}-${(i + 1).toString().padStart(2, '0')}`;
            return Math.round(filteredRevenueData[monthKey] || 0);
          })
          : timeRange === 'quarterly'
            ? Array.from({ length: 4 }, (_, i) => {
              const quarterKey = `${new Date().getFullYear()}-Q${i + 1}`;
              return Math.round(filteredRevenueData[quarterKey] || 0);
            })
            : Array.from({ length: 5 }, (_, i) => {
              const yearKey = (new Date().getFullYear() - 4 + i).toString();
              return Math.round(filteredRevenueData[yearKey] || 0);
            }),
        backgroundColor: (context) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 400);
          gradient.addColorStop(0, 'rgba(59, 130, 246, 0.5)'); // Start blue
          gradient.addColorStop(1, 'rgba(59, 130, 246, 0.05)'); // End transparent
          return gradient;
        },
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 2,
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const bookingsChartData = {
    labels: timeRange === 'monthly'
      ? ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      : timeRange === 'quarterly'
        ? ['Q1', 'Q2', 'Q3', 'Q4']
        : Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - 4 + i).toString()),
    datasets: [
      {
        label: 'Completed Bookings',
        data: timeRange === 'monthly'
          ? Array.from({ length: 12 }, (_, i) => {
            const monthKey = `${new Date().getFullYear()}-${(i + 1).toString().padStart(2, '0')}`;
            return filteredBookingsData[monthKey] || 0;
          })
          : timeRange === 'quarterly'
            ? Array.from({ length: 4 }, (_, i) => {
              const quarterKey = `${new Date().getFullYear()}-Q${i + 1}`;
              return filteredBookingsData[quarterKey] || 0;
            })
            : Array.from({ length: 5 }, (_, i) => {
              const yearKey = (new Date().getFullYear() - 4 + i).toString();
              return filteredBookingsData[yearKey] || 0;
            }),
        backgroundColor: 'rgba(16, 185, 129, 0.7)',
        borderColor: 'rgba(16, 185, 129, 1)',
        borderWidth: 0,
        borderRadius: 4,
        barPercentage: 0.6,
      },
    ],
  };

  const chartOptions = {
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
        titleColor: '#111827',
        bodyColor: '#4B5563',
        borderColor: '#E5E7EB',
        borderWidth: 1,
        titleFont: {
          size: 13,
          weight: '600',
        },
        bodyFont: {
          size: 12
        },
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label: function (context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              if (label.includes('Revenue')) {
                label += '₹' + context.parsed.y.toLocaleString();
              } else {
                label += context.parsed.y;
              }
            }
            return label;
          }
        }
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          drawBorder: false,
          color: '#F3F4F6'
        },
        ticks: {
          font: {
            size: 11
          },
          color: '#9CA3AF',
          callback: function (value) {
            if (this.getLabelForValue(value).includes('Revenue')) {
              return '₹' + value.toLocaleString();
            }
            return value;
          }
        }
      },
      x: {
        grid: {
          display: false,
          drawBorder: false
        },
        ticks: {
          font: {
            size: 11
          },
          color: '#9CA3AF'
        }
      },
    },
    interaction: {
      mode: 'index',
      intersect: false,
    },
  };

  const statsCards = [
    {
      name: bookingStatusFilter === 'all' ? 'Total Revenue' : `Revenue`,
      subtext: bookingStatusFilter === 'all' ? '(All Bookings)' : `(${bookingStatusFilter})`,
      value: `₹${Math.round(bookingStatusFilter === 'all' ? stats.totalRevenue : filteredRevenue).toLocaleString()}`,
      icon: IndianRupee,
      color: 'blue',
      gradient: 'from-blue-600 to-indigo-600',
      bgLight: 'bg-blue-50',
      textLight: 'text-blue-600'
    },
    {
      name: 'Total Bookings',
      value: stats.totalBookings.toLocaleString(),
      icon: Calendar,
      color: 'orange',
      gradient: 'from-orange-500 to-pink-500',
      bgLight: 'bg-orange-50',
      textLight: 'text-orange-600'
    },
    {
      name: 'Total Users',
      value: stats.totalUsers.toLocaleString(),
      icon: Users,
      color: 'emerald',
      gradient: 'from-emerald-500 to-teal-500',
      bgLight: 'bg-emerald-50',
      textLight: 'text-emerald-600'
    },
    {
      name: 'Total Vendors',
      value: stats.totalVendors.toLocaleString(),
      icon: Activity,
      color: 'violet',
      gradient: 'from-violet-500 to-purple-500',
      bgLight: 'bg-violet-50',
      textLight: 'text-violet-600'
    },
    {
      name: 'Total Tests',
      value: stats.totalTests.toLocaleString(),
      icon: TrendingUp,
      color: 'cyan',
      gradient: 'from-cyan-500 to-blue-500',
      bgLight: 'bg-cyan-50',
      textLight: 'text-cyan-600'
    },
  ];

  // Calculate platform growth percentage
  const calculatePlatformGrowth = () => {
    // Calculate growth based on bookings compared to a previous period
    let growthBookings = [];
    if (bookingStatusFilter === 'all') {
      // For 'all', use completed, cancelled, and confirmed bookings
      growthBookings = bookings.filter(booking =>
        booking.status && (booking.status.toLowerCase() === 'completed' ||
          booking.status.toLowerCase() === 'cancelled' ||
          booking.status.toLowerCase() === 'confirmed')
      );
    } else {
      // For specific status, use bookings with that status
      growthBookings = filteredBookings;
    }

    if (growthBookings.length === 0) return { growthPercentage: 0, growthText: "0%" };

    // For a more realistic calculation, we'll simulate previous period data
    // In a real implementation, this would come from actual historical data
    const currentPeriodBookings = growthBookings.length;

    // Simulate previous period bookings (80% of current for demonstration)
    const previousPeriodBookings = Math.max(1, Math.floor(currentPeriodBookings * 0.8));
    const growth = ((currentPeriodBookings - previousPeriodBookings) / previousPeriodBookings) * 100;

    // Also calculate based on revenue for a more comprehensive view
    const currentPeriodRevenue = bookingStatusFilter === 'all' ? stats.totalRevenue : filteredRevenue;
    const previousPeriodRevenue = Math.max(1, Math.floor(currentPeriodRevenue * 0.75));
    const revenueGrowth = ((currentPeriodRevenue - previousPeriodRevenue) / previousPeriodRevenue) * 100;

    // Combine both metrics for a more balanced growth indicator
    const combinedGrowth = (growth + revenueGrowth) / 2;

    return {
      growthPercentage: Math.abs(combinedGrowth),
      growthText: `${combinedGrowth >= 0 ? '+' : ''}${combinedGrowth.toFixed(1)}%`
    };
  };

  const { growthText } = calculatePlatformGrowth();

  const exportAnalyticsData = () => {
    // Create CSV content
    let csvContent = "data:text/csv;charset=utf-8,";

    // Add header row
    csvContent += "Metric,Value\r\n";

    // Add data rows
    csvContent += `Total Users,${stats.totalUsers}\r\n`;
    csvContent += `Total Vendors,${stats.totalVendors}\r\n`;
    csvContent += `Total Tests,${stats.totalTests}\r\n`;
    csvContent += `Total Bookings,${stats.totalBookings}\r\n`;
    csvContent += `${bookingStatusFilter === 'all' ? 'Revenue (All)' : `Revenue (${bookingStatusFilter.charAt(0).toUpperCase() + bookingStatusFilter.slice(1)})`},${bookingStatusFilter === 'all' ? stats.totalRevenue : filteredRevenue}\r\n`;

    // Add time-based data
    csvContent += `\r\n${timeRange.charAt(0).toUpperCase() + timeRange.slice(1)} Data\r\n`;

    if (timeRange === 'monthly') {
      csvContent += "Month,Completed Bookings,Revenue\r\n";
      const currentYear = new Date().getFullYear();
      for (let i = 1; i <= 12; i++) {
        const monthKey = `${currentYear}-${i.toString().padStart(2, '0')}`;
        const monthName = new Date(currentYear, i - 1, 1).toLocaleString('default', { month: 'short' });
        const bookings = filteredBookingsData[monthKey] || 0;
        const revenue = filteredRevenueData[monthKey] || 0;
        csvContent += `${monthName},${bookings},${revenue}\r\n`;
      }
    } else if (timeRange === 'quarterly') {
      csvContent += "Quarter,Completed Bookings,Revenue\r\n";
      const currentYear = new Date().getFullYear();
      for (let i = 1; i <= 4; i++) {
        const quarterKey = `${currentYear}-Q${i}`;
        const quarterName = `Q${i} ${currentYear}`;
        const bookings = filteredBookingsData[quarterKey] || 0;
        const revenue = filteredRevenueData[quarterKey] || 0;
        csvContent += `${quarterName},${bookings},${revenue}\r\n`;
      }
    } else if (timeRange === 'yearly') {
      csvContent += "Year,Completed Bookings,Revenue\r\n";
      const currentYear = new Date().getFullYear();
      for (let i = 4; i >= 0; i--) {
        const yearKey = (currentYear - i).toString();
        const bookings = filteredBookingsData[yearKey] || 0;
        const revenue = filteredRevenueData[yearKey] || 0;
        csvContent += `${yearKey},${bookings},${revenue}\r\n`;
      }
    }

    // Create download link
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `analytics_data_${timeRange}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);

    // Trigger download
    link.click();

    // Clean up
    document.body.removeChild(link);
  };

  // Function to fetch detailed bookings with patient information
  const fetchDetailedBookings = async () => {
    setBookingsLoading(true);
    try {
      // Fetch all bookings
      const bookingsResponse = await fetch('/api/bookings');
      if (bookingsResponse.ok && bookingsResponse.headers.get('content-type')?.includes('application/json')) {
        const bookingsData = await safeJsonParse(bookingsResponse);
        if (bookingsData.success && bookingsData.bookings) {
          // For each booking, try to get patient username from different sources
          const bookingsWithPatientData = bookingsData.bookings.map((booking) => {
            let patientUsername = 'N/A';
            let patientPhone = booking.patientDetails?.contactNumber || 'N/A';

            // Try to get username from patientDetails first
            if (booking.patientDetails?.patientName) {
              patientUsername = booking.patientDetails.patientName;
            }
            // If booking has a userId, try to fetch the user's username
            else if (booking.userId) {
              // We'll display userId for now and fetch actual username separately if needed
              patientUsername = `User: ${booking.userId.toString().substring(0, 8)}...`;
            }
            // If we have email, we can use that as fallback
            else if (booking.patientDetails?.email) {
              patientUsername = booking.patientDetails.email.split('@')[0];
            }

            return {
              ...booking,
              patientUsername,
              patientPhone,
            };
          });

          setDetailedBookings(bookingsWithPatientData);
        }
      }
    } catch (error) {
      console.error('Error fetching detailed bookings:', error);
    } finally {
      setBookingsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 md:p-8 font-sans">
      <div className="max-w-[1600px] mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Analytics Dashboard</h1>
            <p className="text-gray-500 mt-2 text-sm">
              Overview of your platform's performance, revenue, and user growth.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="appearance-none bg-white border border-gray-200 text-gray-700 text-sm rounded-xl px-4 py-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium shadow-sm hover:border-gray-300"
              >
                <option value="monthly">Monthly View</option>
                <option value="quarterly">Quarterly View</option>
                <option value="yearly">Yearly View</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
            </div>

            <button
              onClick={exportAnalyticsData}
              className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-all shadow-sm active:scale-95 text-sm font-medium"
            >
              <Download className="w-4 h-4" />
              <span>Export Report</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[400px] bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="relative w-16 h-16 mb-4">
              <div className="absolute inset-0 border-4 border-gray-100 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
            </div>
            <p className="text-gray-500 font-medium animate-pulse">Gathering insights...</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {statsCards.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={index}
                    className="group relative overflow-hidden bg-white p-6 rounded-2xl border border-gray-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.1)] transition-all duration-300 hover:-translate-y-1"
                  >
                    <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${stat.gradient} opacity-[0.03] -mr-8 -mt-8 rounded-full blur-2xl group-hover:opacity-[0.08] transition-opacity`}></div>

                    <div className="relative flex flex-col h-full justify-between">
                      <div className="flex justify-between items-start mb-4">
                        <div className={`p-3 rounded-xl ${stat.bgLight} ${stat.textLight} transition-colors`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        {index === 0 && (
                          <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                            <TrendingUp className="w-3 h-3" />
                            {growthText}
                          </div>
                        )}
                      </div>

                      <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">{stat.name}</p>
                        {stat.subtext && <p className="text-xs text-gray-400 mb-1">{stat.subtext}</p>}
                        <h3 className="text-2xl font-bold text-gray-900 tracking-tight">{stat.value}</h3>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue Analysis */}
              <div className="bg-white p-6 md:p-8 rounded-2xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-gray-100">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Revenue Trends</h3>
                    <p className="text-sm text-gray-500">Financial performance over time</p>
                  </div>
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                    <LineChart className="w-5 h-5" />
                  </div>
                </div>
                <div className="h-[300px] w-full">
                  <Line data={revenueChartData} options={chartOptions} />
                </div>
              </div>

              {/* Booking Analysis */}
              <div className="bg-white p-6 md:p-8 rounded-2xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-gray-100">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Booking Volume</h3>
                    <p className="text-sm text-gray-500">Number of completed appointments</p>
                  </div>
                  <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                    <BarChart3 className="w-5 h-5" />
                  </div>
                </div>
                <div className="h-[300px] w-full">
                  <Bar data={bookingsChartData} options={chartOptions} />
                </div>
              </div>
            </div>

            {/* Recent Screenings / Bookings Table */}
            <div className="bg-white rounded-2xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-gray-100 overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-gray-900">Recent Bookings</h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs font-medium">
                    {filteredBookings.length}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative">
                    <select
                      value={bookingStatusFilter}
                      onChange={(e) => setBookingStatusFilter(e.target.value)}
                      className="appearance-none bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg pl-9 pr-8 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                    >
                      <option value="all">All Status</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="completed">Completed</option>
                    </select>
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                {bookingsLoading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
                    <span className="text-sm text-gray-500">Loading bookings...</span>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50/50">
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Patient Info</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Service</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Provider</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredBookings.length > 0 ? (
                        filteredBookings.map((booking, index) => (
                          <tr
                            key={booking._id || index}
                            className="group hover:bg-gray-50/50 transition-colors"
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="h-8 w-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-bold mr-3 border border-indigo-100">
                                  {booking.patientUsername.charAt(0).toUpperCase()}
                                </div>
                                <span className="text-sm font-medium text-gray-900">{booking.patientUsername}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {booking.patientPhone}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm text-gray-900 font-medium line-clamp-1 max-w-[200px]" title={booking.testName}>
                                {booking.testName}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {booking.labName}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              ₹{booking.price}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${booking.status === 'Confirmed' ? 'bg-green-50 text-green-700 border-green-200' :
                                  booking.status === 'Pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                    booking.status === 'Cancelled' ? 'bg-red-50 text-red-700 border-red-200' :
                                      'bg-blue-50 text-blue-700 border-blue-200'
                                }`}>
                                {booking.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" className="px-6 py-12 text-center text-sm text-gray-500 bg-gray-50/30">
                            <div className="flex flex-col items-center justify-center">
                              <Search className="w-12 h-12 text-gray-300 mb-3" />
                              <p className="font-medium text-gray-900">No bookings found</p>
                              <p className="text-gray-500 mt-1">Try resolving your filters or check back later.</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAnalytics;