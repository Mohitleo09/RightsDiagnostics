'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Navbar from '../../page';
import Footer from '../../footer/page';
import { withAuth } from '../../../utils/authGuard';
import AdvertisementBanner from '../../../components/AdvertisementBanner';

// --- UI Components ---

const IconBox = ({ icon, className = "bg-gray-50 text-gray-600" }) => (
  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${className} flex-shrink-0`}>
    {icon}
  </div>
);

const SectionTitle = ({ title, subtitle }) => (
  <div className="mb-6">
    <h2 className="text-2xl font-bold text-gray-900 tracking-tight">{title}</h2>
    {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
  </div>
);

const Card = ({ children, className = "", id }) => (
  <section id={id} className={`bg-white rounded-2xl border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] p-6 sm:p-8 scroll-mt-28 ${className}`}>
    {children}
  </section>
);

const LabBadge = ({ text, type = "default" }) => {
  const styles = {
    default: "bg-gray-100 text-gray-600",
    success: "bg-emerald-50 text-emerald-700 border border-emerald-100",
    blue: "bg-blue-50 text-blue-700 border border-blue-100"
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold uppercase tracking-wider ${styles[type] || styles.default}`}>
      {text}
    </span>
  );
};

function FindTestsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [testName, setTestName] = useState('');
  const [testId, setTestId] = useState('');
  const [testData, setTestData] = useState(null);
  const [availableLabs, setAvailableLabs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('overview');
  const [expandedFaq, setExpandedFaq] = useState(null);

  // --- Scroll Logic ---
  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) {
      const top = el.getBoundingClientRect().top + window.pageYOffset - 110;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) setActiveSection(e.target.id); });
    }, { threshold: 0.2, rootMargin: "-20% 0px -20% 0px" });
    document.querySelectorAll('section[id]').forEach(s => observer.observe(s));
    return () => observer.disconnect();
  }, [isLoading]);

  // --- Data Logic ---
  useEffect(() => {
    const name = searchParams.get('testName');
    const id = searchParams.get('testId');
    if (name) setTestName(decodeURIComponent(name));
    if (id) setTestId(id);

    const loadData = async () => {
      try {
        setIsLoading(true);
        const [tRes, vRes] = await Promise.all([fetch('/api/tests'), fetch('/api/vendors')]);
        const tData = await tRes.json();
        const vData = await vRes.json();

        if (tData.success && vData.success) {
          const vendors = vData.vendors?.filter(v => v.approvalStatus === 'approved' && v.status === 'active') || [];

          let matches = [];
          if (id) {
            const t = tData.tests?.find(x => x._id === id);
            if (t) matches = tData.tests?.filter(x => x.testName === t.testName) || [];
          } else if (name) {
            matches = tData.tests?.filter(x => x.testName === name) || [];
          }

          if (matches.length > 0) {
            const base = matches[0];
            const labSet = new Set();
            matches.forEach(m => {
              if (m.availableAtLabs) m.availableAtLabs.split(',').forEach(l => labSet.add(l.trim()));
              if (m.vendorId) {
                const v = vendors.find(vend => vend._id === m.vendorId);
                if (v) labSet.add(v.labName || v.vendorName);
              }
            });

            const prices = matches.map(m => m.price).filter(Boolean).map(p =>
              typeof p === 'string' && p.includes('-') ? parseFloat(p.split('-')[0]) : parseFloat(p)
            );
            const minP = prices.length ? Math.min(...prices) : 0;
            const maxP = prices.length ? Math.max(...prices) : 0;

            const structuredData = {
              ...base,
              displayPrice: minP === maxP ? `₹${minP}` : `₹${minP} - ₹${maxP}`,
              actualPrice: matches.reduce((acc, m) => ({ ...acc, ...(m.actualPrice || {}) }), {}),
              labCount: labSet.size,
              faqs: generateFaqs(base)
            };
            setTestData(structuredData);
            setAvailableLabs(vendors.filter(v =>
              Array.from(labSet).some(l => l === v.labName || l === v.vendorName)
            ));
          }
        }
        setIsLoading(false);
      } catch (e) { console.error(e); setIsLoading(false); }
    };
    loadData();
  }, [searchParams]);

  const generateFaqs = (data) => ([
    { q: `What is the ${data.testName} Test?`, a: data.overview || "This is a diagnostic test. Consult your doctor for details." },
    { q: "Is fasting required?", a: data.testPreparation?.some(p => p.point.toLowerCase().includes('fast')) ? "Yes, fasting is likely required. Check preparation details." : "Usually no, but follow doctor's advice." },
    { q: "When will I get the specific report?", a: "Most reports are delivered within 24-48 hours digitally." },
    { q: "How is the sample collected?", a: "A trained phlebotomist will collect a blood sample from a vein in your arm." }
  ]);

  const handleBook = withAuth((lab) => {
    let p = testData?.price;
    // Price logic fallback
    if (testData?.actualPrice?.[lab.labName]) p = testData.actualPrice[lab.labName];
    else if (testData?.actualPrice?.[lab.vendorName]) p = testData.actualPrice[lab.vendorName];

    // Fallback to min price if still range or undefined, just for booking entry
    const finalPrice = p || '0';

    const q = new URLSearchParams({
      testId: testId,
      testName: testName,
      labId: lab._id,
      labName: lab.labName || lab.vendorName || 'Lab',
      labAddress: lab.address || '',
      price: finalPrice
    });
    router.push(`/Patients/FindTests/bookatthislab?${q.toString()}`);
  }, 'Please login to book');

  // --- Render ---

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-slate-800 font-sans">
      <Navbar />

      {/* Hero Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
          <div className="max-w-4xl">
            <div className="flex items-center gap-2 mb-4 animate-fade-in">
              <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border border-blue-100">Pathology Test</span>
              {testData?.labCount > 0 && (
                <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border border-emerald-100 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Available Now
                </span>
              )}
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight mb-4">
              {testName || testData?.testName || "Loading..."}
            </h1>
            <p className="text-lg text-gray-500 max-w-2xl leading-relaxed">
              Book this test from verified labs near you. Compare prices, check preparation guidelines, and get digital reports conveniently.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">

          {/* Main Content */}
          <div className="lg:col-span-8 space-y-8">
            {isLoading ? (
              <div className="space-y-6">
                <div className="h-48 bg-white rounded-2xl animate-pulse shadow-sm"></div>
                <div className="h-48 bg-white rounded-2xl animate-pulse shadow-sm"></div>
              </div>
            ) : testData ? (
              <>
                {/* Available Labs - Prioritized */}
                <Card id="labs" className="border-blue-100 shadow-[0_4px_20px_rgba(37,99,235,0.06)] ring-1 ring-blue-50">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Available Laboratories</h2>
                      <p className="text-sm text-gray-500">Compare and choose the best option</p>
                    </div>
                    <span className="bg-gray-900 text-white px-3 py-1 rounded-lg text-xs font-bold">{availableLabs.length} Labs</span>
                  </div>

                  <div className="space-y-3">
                    {availableLabs.length > 0 ? (
                      availableLabs.map((lab, i) => {
                        let price = testData.displayPrice;
                        if (testData.actualPrice?.[lab.labName]) price = `₹${testData.actualPrice[lab.labName]}`;
                        else if (testData.actualPrice?.[lab.vendorName]) price = `₹${testData.actualPrice[lab.vendorName]}`;

                        return (
                          <div key={i} className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-blue-200 bg-white hover:bg-blue-50/30 transition-all duration-200">
                            <div className="flex items-center gap-4 mb-3 sm:mb-0">
                              <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-lg font-bold text-gray-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                {(lab.labName || 'L').charAt(0)}
                              </div>
                              <div>
                                <h4 className="font-bold text-gray-900">{lab.labName || lab.vendorName}</h4>
                                <p className="text-xs text-gray-500 truncate max-w-[200px]">{lab.address || 'Address on request'}</p>
                              </div>
                            </div>

                            <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pl-16 sm:pl-0">
                              <div className="text-right">
                                <div className="text-lg font-bold text-gray-900">{price}</div>
                                <div className="text-[10px] text-gray-400 uppercase font-medium">Standard Price</div>
                              </div>
                              <button
                                onClick={() => handleBook(lab)}
                                className="px-5 py-2 bg-gray-900 text-white text-sm font-semibold rounded-lg hover:bg-blue-600 transition-colors shadow-sm active:scale-95"
                              >
                                Book
                              </button>
                            </div>
                          </div>
                        )
                      })
                    ) : (
                      <div className="text-center py-10">
                        <p className="text-gray-500">No labs currently offering this test.</p>
                      </div>
                    )}
                  </div>
                  {availableLabs.length > 3 && (
                    <button className="w-full mt-4 py-2 text-sm text-blue-600 font-semibold hover:bg-blue-50 rounded-lg transition-colors">View All Labs</button>
                  )}
                </Card>

                {/* Overview Card */}
                <Card id="overview">
                  <div className="flex items-start gap-4">
                    <IconBox icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} className="bg-indigo-50 text-indigo-600" />
                    <div>
                      <SectionTitle title="Overview" />
                      <div className="text-gray-600 leading-relaxed space-y-4 font-normal">
                        <p>{testData.overview || 'Comprehensive overview information is not available for this test at the moment.'}</p>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Preparation Card */}
                <Card id="preparation">
                  <div className="flex items-start gap-4">
                    <IconBox icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} className="bg-emerald-50 text-emerald-600" />
                    <div className="w-full">
                      <SectionTitle title="Preparation & Guidelines" subtitle="Follow these steps for accurate results" />

                      {testData.testPreparation?.length > 0 ? (
                        <div className="grid gap-3">
                          {testData.testPreparation.map((p, i) => (
                            <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100">
                              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold mt-0.5">{i + 1}</span>
                              <span className="text-sm text-gray-700">{p.point}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 italic">No specific preparation required.</p>
                      )}
                    </div>
                  </div>
                </Card>

                {/* Videos */}
                {testData.youtubeLinks?.length > 0 && (
                  <Card id="videos">
                    <SectionTitle title="Video Resources" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {testData.youtubeLinks.slice(0, 4).map((link, i) => {
                        const vId = link.match(/v=([^&]+)/)?.[1] || link.match(/youtu\.be\/([^?]+)/)?.[1];
                        return (
                          <a key={i} href={link} target="_blank" className="block group relative aspect-video rounded-xl overflow-hidden bg-black">
                            <img src={`https://img.youtube.com/vi/${vId}/hqdefault.jpg`} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt="Video" />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                                <svg className="w-5 h-5 text-white fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                              </div>
                            </div>
                          </a>
                        )
                      })}
                    </div>
                  </Card>
                )}

                {/* FAQ */}
                <Card id="faq">
                  <div className="flex items-center gap-3 mb-6">
                    <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093" /></svg>
                    <h2 className="text-xl font-bold text-gray-900">Frequently Asked Questions</h2>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {testData.faqs?.map((f, i) => (
                      <div key={i} className="py-4 first:pt-0 last:pb-0">
                        <button onClick={() => setExpandedFaq(expandedFaq === i ? null : i)} className="w-full flex justify-between items-center text-left hover:text-blue-600 transition-colors">
                          <span className="font-semibold text-gray-800 text-sm">{f.q}</span>
                          <span className="text-gray-400 text-lg leading-none ml-4">{expandedFaq === i ? '−' : '+'}</span>
                        </button>
                        <div className={`overflow-hidden transition-all duration-200 ${expandedFaq === i ? 'max-h-32 mt-2 opacity-100' : 'max-h-0 opacity-0'}`}>
                          <p className="text-sm text-gray-500 leading-relaxed pr-8">{f.a}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </>
            ) : (
              <div className="p-8 text-center border border-red-100 bg-red-50 rounded-2xl text-red-600">Failed to load test information.</div>
            )}
          </div>

          {/* Sticky Sidebar */}
          <aside className="lg:col-span-4 space-y-6">
            <div className="sticky top-28 space-y-6">

              {/* Quick Nav */}
              <div className="bg-white rounded-2xl border border-gray-100 p-2 shadow-sm">
                <div className="space-y-1">
                  {[
                    { id: 'labs', label: 'Laboratories', icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" },
                    { id: 'overview', label: 'Overview', icon: "M4 6h16M4 12h16M4 18h7" },
                    { id: 'preparation', label: 'Preparation', icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
                    { id: 'videos', label: 'Videos', icon: "M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" },
                    { id: 'faq', label: 'Questions', icon: "M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093" }
                  ].map(item => (
                    <button
                      key={item.id}
                      onClick={() => scrollTo(item.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeSection === item.id ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
                    >
                      <svg className={`w-4 h-4 ${activeSection === item.id ? 'text-gray-900' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                      </svg>
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Ad Placeholder */}
              <div className="rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                <AdvertisementBanner contentType="Content" className="w-full" />
              </div>

              {/* Help Widget */}
              <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-2xl p-6 text-white text-center shadow-lg relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                <div className="relative z-10">
                  <h4 className="font-bold text-lg">Need help booking?</h4>
                  <p className="text-white/80 text-xs mt-2 mb-4 leading-relaxed">Our support team is available to assist you with finding specific tests or labs.</p>
                  <button className="bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white rounded-lg px-6 py-2 text-xs font-bold transition-all w-full">Contact Support</button>
                </div>
              </div>
            </div>
          </aside>

        </div>
      </div>
      <Footer />
    </div>
  );
}

export default FindTestsContent;