'use client';

import React from 'react';
import Link from 'next/link';

export default function Category() {
  const categories = [
    {
      title: 'Men Health',
      price: '₹333',
      image: '/Category/men.png',
      link: '/Patients/Category/men'
    },
    {
      title: 'Women Health',
      price: '₹333',
      image: '/Category/women.png',
      link: '/Patients/Category/women'
    },
    {
      title: 'Kids Health',
      price: '₹333',
      image: '/Category/kids.png',
      link: '/Patients/Category/kids'
    },
    {
      title: 'Couples Health',
      price: '₹333',
      image: '/Category/couples.png',
      link: '/Patients/Category/couples'
    },
    {
      title: 'Elders Health',
      price: '₹333',
      image: '/Category/elders.png',
      link: '/Patients/Category/elders'
    },
  ];

  return (
    <section className="py-12 bg-white">
      <div className="max-w-full mx-auto px-26">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-extrabold text-gray-900 mb-4">Health Packages by Category</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Choose from our specialized health packages designed for your specific needs
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {categories.map((cat, index) => (
            <Link
              key={index}
              href={cat.link}
              className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100 hover:border-[#00A3FF] hover:-translate-y-1 block"
            >
              <div className="aspect-[16/11] w-full bg-gray-100">
                <img
                  src={cat.image}
                  alt={cat.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = '/placeholder-category.png';
                  }}
                />
              </div>
              <div className="p-5 text-center">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{cat.title}</h3>
                <p className="text-gray-600 text-sm mb-3">Checkup Starting from</p>
                <div className="text-2xl font-extrabold text-[#0052FF] mb-4">{cat.price}</div>
                <div className="text-[#0052FF] font-medium hover:text-[#0052FF] transition-colors">
                  View Details →
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}