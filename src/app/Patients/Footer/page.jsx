'use client'

import React from 'react'
import { MapPin, Phone, Mail, Facebook, Twitter, Instagram, Linkedin, Youtube, ArrowUp } from 'lucide-react'
import Image from 'next/image'

const Footer = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const quickLinks = [
    { name: 'Home', href: '/' },
    { name: 'Find Tests', href: '/Patients/FindTests' },
    { name: 'Find Labs', href: '/Patients/FindLabs' },
    { name: 'Help & Support ', href: '/Patients/HelpSupport' }
  ]

  const categories = [
    { name: 'Men', href: '/Patients/Category/men' },
    { name: 'Women', href: '/Patients/Category/women' },
    { name: 'Kids', href: '/Patients/Category/kids' },
    { name: 'Couples', href: '/Patients/Category/couples' },
    { name: 'Elders', href: '/Patients/Category/elders' }
  ]

  const legalLinks = [
    { name: 'Privacy Policy', href: '#' },
    { name: 'Terms of Service', href: '#' },
    { name: 'Refund Policy', href: '#' },
    { name: 'Lab Report Disclaimer', href: '#' },
    { name: 'Patient Rights', href: '#' }
  ]



  return (
    <footer className="bg-gradient-to-r from-black to-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="lg:col-span-1">
            <div className="mb-6">
              <Image
                src="/rightslogo.png"
                alt="Rights Diagnostics Logo"
                width={48}
                height={48}
                className="h-12 w-auto mb-4"
              />
              <h3 className="text-2xl font-bold text-[#007AFF] mb-4">Rights Diagnostics</h3>
            </div>
            <p className="text-gray-300 mb-6 leading-relaxed">
              Your trusted partner in healthcare diagnostics. Providing accurate, reliable, and timely lab test results for over 15 years.
            </p>

            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <MapPin className="h-5 w-5 text-[#007AFF] mt-1 flex-shrink-0" />
                <div>
                  <p className="text-gray-300">Hyderbad, Telangana</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-[#007AFF] flex-shrink-0" />
                <div>
                  <p className="text-gray-300">+91 9876543211</p>

                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-[#007AFF] flex-shrink-0" />
                <div>
                  <p className="text-gray-300">rightsdiagnostics@gmail.com</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-6">Quick Links</h4>
            <ul className="space-y-3">
              {quickLinks.map((link, index) => (
                <li key={index}>
                  <a
                    href={link.href}
                    className="text-gray-300 hover:text-[#0052FF] transition-colors duration-200"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-6">Category</h4>
            <ul className="space-y-3">
              {categories.map((category, index) => (
                <li key={index}>
                  <a
                    href={category.href}
                    className="text-gray-300 hover:text-[#0052FF] transition-colors duration-200"
                  >
                    {category.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal & Social */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-6">Legal</h4>
            <ul className="space-y-3 mb-8">
              {legalLinks.map((link, index) => (
                <li key={index}>
                  <a
                    href={link.href}
                    className="text-gray-300 hover:text-[#0052FF] transition-colors duration-200"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>

            <div>
              <h4 className="text-lg font-semibold text-white mb-4">Follow Us</h4>
              <div className="flex space-x-4">
                <a
                  href="#"
                  className="bg-gray-800 p-3 rounded-full hover:bg-[#007AFF] transition-all duration-300 transform hover:scale-110"
                >
                  <Facebook className="h-5 w-5" />
                </a>
                {/* <a
                  href="#"
                  className="bg-gray-800 p-3 rounded-full hover:bg-[#007AFF] transition-all duration-300 transform hover:scale-110"
                >
                  <Twitter className="h-5 w-5" />
                </a> */}
                <a
                  href="#"
                  className="bg-gray-800 p-3 rounded-full hover:bg-[#007AFF] transition-all duration-300 transform hover:scale-110"
                >
                  <Instagram className="h-5 w-5" />
                </a>
                <a
                  href="#"
                  className="bg-gray-800 p-3 rounded-full hover:bg-[#007AFF] transition-all duration-300 transform hover:scale-110"
                >
                  <Linkedin className="h-5 w-5" />
                </a>
                <a
                  href="#"
                  className="bg-gray-800 p-3 rounded-full hover:bg-[#007AFF] transition-all duration-300 transform hover:scale-110"
                >
                  <Youtube className="h-5 w-5" />
                </a>

              </div>
            </div>
          </div>
        </div>



        {/* Bottom Bar */}
        <div className="border-t border-gray-700 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <div className="text-gray-300 text-sm mb-4 md:mb-0">
            <p>&copy; {new Date().getFullYear()} Rights Diagnostics. All rights reserved. | Designed with care for your health</p>
          </div>

          <button
            onClick={scrollToTop}
            className="bg-[#007AFF] hover:bg-[#0052FF] p-3 rounded-full transition-all duration-300 transform hover:scale-110"
          >
            <ArrowUp className="h-5 w-5" />
          </button>
        </div>
      </div>
    </footer>
  )
}

export default Footer
