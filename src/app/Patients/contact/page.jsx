'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Phone, Mail, MessageCircle, Send,
  MapPin, Facebook, Twitter, Instagram, Linkedin,
  ArrowRight, Globe
} from 'lucide-react';
import { toast } from 'react-toastify';
import Navbar from '../page';
import Footer from '../Footer/page';

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    phoneNumber: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      toast.error('Please fill in required fields');
      return;
    }
    setIsSubmitting(true);
    // Simulate API
    setTimeout(() => {
      toast.success("Message sent successfully!");
      setFormData({ name: '', email: '', subject: '', phoneNumber: '', message: '' });
      setIsSubmitting(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#F0F4F8] font-sans text-gray-900 flex flex-col">
      <Navbar />

      <div className="flex-1 flex items-center justify-center p-4 lg:p-8 relative overflow-hidden">
        {/* Background Orbs */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-200/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-purple-200/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>

        <div className="bg-white rounded-[2rem] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.1)] overflow-hidden max-w-6xl w-full flex flex-col lg:flex-row min-h-[700px] relative z-10 border border-white/50">

          {/* Left Panel: Information (Dark/Brand) */}
          <div className="lg:w-[40%] bg-[#2874F0] p-10 lg:p-14 text-white relative flex flex-col justify-between overflow-hidden">
            {/* Pattern Overlay */}
            <div className="absolute inset-0 opacity-10 pattern-dots"></div>
            <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-2xl"></div>
            <div className="absolute top-12 -left-12 w-48 h-48 bg-blue-400/20 rounded-full blur-xl"></div>

            <div className="relative z-10">
              <h2 className="text-4xl font-black mb-6 tracking-tight">Let's discuss <br /> your health.</h2>
              <p className="text-blue-100 text-lg leading-relaxed mb-12">
                Fill out the form and our medical team will get back to you within 24 hours.
              </p>

              <div className="space-y-8">
                <a href="tel:+917095818047" className="flex items-center gap-5 group cursor-pointer">
                  <div className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center group-hover:bg-white group-hover:text-[#2874F0] transition-all">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-blue-200 uppercase tracking-wider mb-1">Call Us</p>
                    <p className="font-semibold text-lg">+91 7095818047</p>
                  </div>
                </a>

                <a href="mailto:rightlabs.hi9@gmail.com" className="flex items-center gap-5 group cursor-pointer">
                  <div className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center group-hover:bg-white group-hover:text-[#2874F0] transition-all">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-blue-200 uppercase tracking-wider mb-1">Email Us</p>
                    <p className="font-semibold text-lg">rightsdiagnostics@gmail.com</p>
                  </div>
                </a>

                <a href="https://wa.me/917095818047" target="_blank" className="flex items-center gap-5 group cursor-pointer">
                  <div className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center group-hover:bg-white group-hover:text-[#2874F0] transition-all">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-blue-200 uppercase tracking-wider mb-1">Visit HQ</p>
                    <p className="font-semibold text-lg max-w-[200px]">Hi-Tech City, Hyderabad, Telangana</p>
                  </div>
                </a>
              </div>
            </div>

            <div className="relative z-10 mt-12 lg:mt-0">
              <p className="text-sm font-medium text-blue-200 mb-4">Connect with us on</p>
              <div className="flex gap-4">
                {[
                  { Icon: Facebook, link: "#", className: "bg-[#1877F2] hover:text-[#1877F2]" },
                  { Icon: Instagram, link: "#", className: "bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] hover:text-[#E1306C]" },
                  { Icon: Linkedin, link: "#", className: "bg-[#0A66C2] hover:text-[#0A66C2]" },
                  { Icon: MessageCircle, link: "https://wa.me/917095818047", className: "bg-[#25D366] hover:text-[#25D366]" }
                ].map((item, i) => (
                  <a key={i} href={item.link} target="_blank" rel="noreferrer" className={`w-10 h-10 rounded-full flex items-center justify-center text-white hover:bg-white transition-all shadow-lg hover:shadow-xl ${item.className}`}>
                    <item.Icon className="w-5 h-5" />
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Right Panel: Form (Light) */}
          <div className="lg:w-[60%] p-10 lg:p-14 bg-white relative">
            <div className="flex justify-between items-start mb-10">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Send Message</h3>
                <p className="text-gray-500">We usually respond in 24 hours.</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid md:grid-cols-2 gap-8">
                <div className="relative group">
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full pb-3 border-b border-gray-200 focus:border-[#2874F0] outline-none text-gray-900 font-medium bg-transparent transition-colors peer"
                    placeholder=" "
                  />
                  <label className="absolute left-0 top-0 text-gray-400 text-sm peer-focus:-top-5 peer-focus:text-[#2874F0] peer-focus:text-xs transition-all pointer-events-none peer-not-placeholder-shown:-top-5 peer-not-placeholder-shown:text-xs">
                    Full Name
                  </label>
                </div>

                <div className="relative group">
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    className="w-full pb-3 border-b border-gray-200 focus:border-[#2874F0] outline-none text-gray-900 font-medium bg-transparent transition-colors peer"
                    placeholder=" "
                  />
                  <label className="absolute left-0 top-0 text-gray-400 text-sm peer-focus:-top-5 peer-focus:text-[#2874F0] peer-focus:text-xs transition-all pointer-events-none peer-not-placeholder-shown:-top-5 peer-not-placeholder-shown:text-xs">
                    Mobile Number
                  </label>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <div className="relative group">
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full pb-3 border-b border-gray-200 focus:border-[#2874F0] outline-none text-gray-900 font-medium bg-transparent transition-colors peer"
                    placeholder=" "
                  />
                  <label className="absolute left-0 top-0 text-gray-400 text-sm peer-focus:-top-5 peer-focus:text-[#2874F0] peer-focus:text-xs transition-all pointer-events-none peer-not-placeholder-shown:-top-5 peer-not-placeholder-shown:text-xs">
                    Email Address
                  </label>
                </div>

                <div className="relative group">
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    className="w-full pb-3 border-b border-gray-200 focus:border-[#2874F0] outline-none text-gray-900 font-medium bg-transparent transition-colors peer"
                    placeholder=" "
                  />
                  <label className="absolute left-0 top-0 text-gray-400 text-sm peer-focus:-top-5 peer-focus:text-[#2874F0] peer-focus:text-xs transition-all pointer-events-none peer-not-placeholder-shown:-top-5 peer-not-placeholder-shown:text-xs">
                    Subject
                  </label>
                </div>
              </div>

              <div className="relative group">
                <textarea
                  name="message"
                  required
                  value={formData.message}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full pb-3 border-b border-gray-200 focus:border-[#2874F0] outline-none text-gray-900 font-medium bg-transparent transition-colors peer resize-none"
                  placeholder=" "
                />
                <label className="absolute left-0 top-0 text-gray-400 text-sm peer-focus:-top-5 peer-focus:text-[#2874F0] peer-focus:text-xs transition-all pointer-events-none peer-not-placeholder-shown:-top-5 peer-not-placeholder-shown:text-xs">
                  Any other details?
                </label>
              </div>

              <div className="pt-6 flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-10 py-4 bg-[#2874F0] text-white rounded-xl font-bold text-lg shadow-xl shadow-blue-500/20 hover:bg-blue-600 hover:-translate-y-1 active:translate-y-0 transition-all flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Sending...' : 'Send Message'} <Send className="w-5 h-5" />
                </button>
              </div>
            </form>
          </div>
        </div>

      </div>

      <Footer />
    </div>
  );
};

export default ContactPage;