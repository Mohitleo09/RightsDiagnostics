'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Activity, Search } from 'lucide-react'

const Hero = () => {
  const router = useRouter();

  const handleBookNow = () => {
    router.push('/Patients/FindTests');
  };

  const handleFindLabs = () => {
    router.push('/Patients/FindLabs');
  };

  return (
    <section className="relative overflow-hidden bg-white">
      {/* Background Gradients using palette with opacity for neatness */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#00CCFF]/5 via-white to-[#00A3FF]/5 pointer-events-none" />

      {/* Decorative decorative blobs - positioned to frame content without obscuring it */}
      <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-[#00CCFF]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-[40rem] h-[40rem] bg-[#00A3FF]/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-28 sm:pt-24 sm:pb-32">
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge - High contrast: Dark text on light blue bg */}
          <div className="inline-flex items-center justify-center mb-8 px-4 py-2 bg-[#00CCFF]/10 border border-[#00CCFF]/20 text-[#0052FF] rounded-full text-sm font-semibold shadow-sm backdrop-blur-sm animate-fade-in-up">
            <span className="mr-2">🎉</span>
            <span>Get up to 50% off on your first booking</span>
          </div>

          {/* Heading */}
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-gray-900 mb-8 leading-tight tracking-tight">
            Book Diagnostic Tests at{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0052FF] via-[#007AFF] to-[#00A3FF]">
              Discounted Prices
            </span>
          </h1>

          {/* Subheading */}
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            Find trusted labs near you, compare prices, and book appointments with exclusive discounts. Your health, our priority.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-8">
            <button
              onClick={handleBookNow}
              className="group relative px-8 py-4 bg-[#0052FF] text-white font-semibold rounded-xl hover:bg-[#0000FF] transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5 w-full sm:w-auto flex items-center justify-center gap-2 overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/20 group-hover:translate-x-full transition-transform duration-500 skew-x-12 -translate-x-full" />
              <span>Book a Test Now</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={handleFindLabs}
              className="px-8 py-4 bg-white text-[#0052FF] font-semibold rounded-xl border-2 border-[#0052FF]/20 hover:border-[#0052FF] hover:bg-[#0052FF]/5 transition-all duration-300 shadow-sm hover:shadow-md w-full sm:w-auto flex items-center justify-center gap-2"
            >
              <Search className="w-5 h-5" />
              <span>Find Labs Near Me</span>
            </button>
          </div>

          {/* Trust Indicators */}
          <div className="mt-16 pt-8 border-t border-gray-100 flex flex-wrap justify-center gap-8 md:gap-16 grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all duration-500">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
              <Activity className="w-5 h-5 text-[#007AFF]" />
              <span>100+ Verified Labs</span>
            </div>
            <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
              <div className="w-5 h-5 rounded-full bg-[#00A3FF]/20 flex items-center justify-center text-[#007AFF] font-bold">₹</div>
              <span>Best Price Guarantee</span>
            </div>
            <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
              <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center text-green-600">✓</div>
              <span>100% Secure Booking</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero