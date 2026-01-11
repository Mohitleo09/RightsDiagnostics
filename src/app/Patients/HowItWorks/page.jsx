'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { Search, Calendar, MapPin, CheckCircle, ArrowRight, Sparkles, Shield, Clock, Home, Users } from 'lucide-react'

const HowItWorks = () => {
  const router = useRouter();

  const handleBookNow = () => {
    router.push('/Patients/FindTests');
  };

  const steps = [
    {
      id: 1,
      title: "Search & Discover",
      description: "Find the perfect lab tests and diagnostic services near you",
      icon: <Search className="w-8 h-8" />,
      gradient: "from-blue-500 to-blue-600",
      bgColor: "bg-white",
      borderColor: "border-gray-100",
      iconBg: "bg-gradient-to-r from-blue-500 to-blue-600",
      textColor: "text-gray-900",
      details: "Browse our comprehensive database of lab tests and services. Filter by location, test type, or lab ratings to find exactly what you need."
    },
    {
      id: 2,
      title: "Book & Schedule",
      description: "Choose your preferred time slot and confirm your appointment",
      icon: <Calendar className="w-8 h-8" />,
      gradient: "from-[#007AFF] to-[#0052FF]",
      bgColor: "bg-white",
      borderColor: "border-gray-100",
      iconBg: "bg-gradient-to-r from-[#007AFF] to-[#0052FF]",
      textColor: "text-gray-900",
      details: "Select a convenient time slot and confirm your booking instantly. Receive confirmation via email and SMS."
    },
    {
      id: 3,
      title: "Visit & Complete",
      description: "Visit the lab with your confirmation and get tested",
      icon: <MapPin className="w-8 h-8" />,
      gradient: "from-green-500 to-green-600",
      bgColor: "bg-white",
      borderColor: "border-gray-100",
      iconBg: "bg-gradient-to-r from-green-500 to-green-600",
      textColor: "text-gray-900",
      details: "Visit the selected lab with your booking confirmation. Our professional staff will guide you through the process."
    }
  ]

  const benefits = [
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Verified Labs",
      description: "All our partner labs are verified and certified"
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: "Fast Results",
      description: "Get your results within 24-48 hours"
    },
    {
      icon: <MapPin className="w-6 h-6" />,
      title: "Convenient Test Availability",
      description: "Available for select tests at your convenience"
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Expert Support",
      description: "Professional staff to guide you through the process"
    }
  ]

  return (
    <div className="min-h-screen bg-white py-12 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-[#007AFF] text-xs font-bold tracking-wide uppercase mb-4">
            Simple Process
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6 tracking-tight">
            How It <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#007AFF] to-[#0052FF]">Works</span>
          </h1>

          <p className="text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
            Experience a seamless healthcare journey. We've simplified diagnostic testing to just three easy steps.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-20">
          {steps.map((step, index) => (
            <div key={step.id} className="relative group">
              {/* Connection Line (Desktop) */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-24 -right-4 z-0 text-gray-100">
                  <ArrowRight className="w-8 h-8" />
                </div>
              )}

              {/* Step Card */}
              <div className="relative bg-white border border-gray-100 rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-xl hover:border-blue-100 hover:-translate-y-1 transition-all duration-300 h-full">
                {/* Step Number */}
                <span className="absolute top-8 right-8 text-6xl font-black text-gray-50 opacity-50 group-hover:text-blue-50 transition-colors select-none">
                  {index + 1}
                </span>

                {/* Icon */}
                <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mb-8 group-hover:bg-[#007AFF] transition-colors duration-300">
                  <div className="text-[#007AFF] group-hover:text-white transition-colors duration-300">
                    {React.cloneElement(step.icon, { className: "w-8 h-8" })}
                  </div>
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-[#007AFF] transition-colors">
                  {step.title}
                </h3>

                <p className="text-gray-600 font-medium mb-4">
                  {step.description}
                </p>

                <p className="text-gray-400 text-sm leading-relaxed">
                  {step.details}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Benefits Section */}
        <div className="bg-gray-50/50 rounded-[2.5rem] p-8 md:p-12 mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight mb-4">Why Choose Us?</h2>
            <p className="text-gray-500">We prioritize your health with premium features</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, index) => (
              <div key={index} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all text-center group">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-50 text-[#007AFF] mb-4 group-hover:scale-110 transition-transform">
                  {benefit.icon}
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{benefit.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Call to Action */}
        <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-r from-[#007AFF] to-[#0052FF] px-6 py-16 md:px-16 text-center shadow-2xl shadow-blue-500/20">
          {/* Decorative circles */}
          <div className="absolute top-0 left-0 w-64 h-64 bg-white opacity-5 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full translate-x-1/2 translate-y-1/2"></div>

          <div className="relative z-10 max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-6 tracking-tight">
              Ready to Prioritize Your Health?
            </h2>
            <p className="text-blue-100 text-lg mb-10 leading-relaxed">
              Join thousands of satisfied users who trust us for their diagnostic needs. Book your test today.
            </p>
            <button
              onClick={handleBookNow}
              className="bg-white text-[#007AFF] px-10 py-4 rounded-xl font-bold text-lg hover:bg-blue-50 hover:shadow-lg hover:scale-105 active:scale-95 transition-all duration-300"
            >
              Get Started Now
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HowItWorks