'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { CheckCircle, Star, ChevronLeft, ChevronRight } from 'lucide-react'
import useEmblaCarousel from 'embla-carousel-react'
import { withAuth } from '../../utils/authGuard'
import { useRouter } from 'next/navigation'

const Packages = () => {
  const [healthPackages, setHealthPackages] = useState([]);
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: false,
    align: 'start',
    slidesToScroll: 1,
    containScroll: 'trimSnaps',
    dragFree: false,
    skipSnaps: true
  });
  const router = useRouter();

  useEffect(() => {
    // Fetch packages immediately without showing any loading message
    const fetchHealthPackages = async () => {
      try {
        const res = await fetch(`/api/health-packages?status=Active&_t=${Date.now()}`, {
          cache: 'no-store'
        });
        const data = await res.json();
        if (data.success) {
          setHealthPackages(data.data);
        }
      } catch (error) {
        console.error('Error fetching health packages:', error);
        // Silently handle errors without showing messages
      }
    };

    fetchHealthPackages();
  }, []);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  // Get user ID for cart key
  const getUserId = () => {
    if (typeof window !== 'undefined') {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      return user.id || user.email || user.phone || 'guest';
    }
    return 'guest';
  };

  // Add package to cart
  const addToCart = withAuth(async (pkg) => {
    if (typeof window !== 'undefined') {
      const cartKey = `cart_${getUserId()}`;
      const currentCart = JSON.parse(localStorage.getItem(cartKey) || '[]');

      // Fetch the full package details to get included tests
      try {
        const res = await fetch(`/api/health-packages?packageId=${pkg.id}&_t=${Date.now()}`, {
          cache: 'no-store'
        });
        const packageData = await res.json();

        console.log('Package API response:', packageData);

        if (packageData.success && packageData.data) {
          const fullPackage = packageData.data;

          // Extract test names from includedTests
          const includedTestNames = (fullPackage.includedTests || []).map(test => {
            if (typeof test === 'string') {
              return test;
            } else if (test && test.testName) {
              return test.testName;
            } else if (test && test.name) {
              return test.name;
            } else {
              return 'Test';
            }
          });

          console.log('Included test names:', includedTestNames);

          // Create cart item for the package
          const cartItem = {
            id: Date.now(), // Unique ID for the cart item
            testName: pkg.name,
            category: "Health Package",
            price: parseFloat(pkg.originalPrice.replace(/[^\d.]/g, '')), // Extract numeric price
            isPackage: true,
            packageId: pkg.id, // Store the package ID for reference
            packageName: pkg.name,
            includedTests: includedTestNames // Store the included tests for lab location lookup
          };

          console.log('Cart item to add:', cartItem);

          // Add to cart
          const newCart = [...currentCart, cartItem];
          localStorage.setItem(cartKey, JSON.stringify(newCart));

          // Dispatch event to notify other components
          window.dispatchEvent(new Event('cartUpdated'));

          // Show success message
          alert(`${pkg.name} has been added to your cart!`);
        } else {
          // Fallback if we can't fetch full package details
          const cartItem = {
            id: Date.now(),
            testName: pkg.name,
            category: "Health Package",
            price: parseFloat(pkg.originalPrice.replace(/[^\d.]/g, '')),
            isPackage: true,
            packageId: pkg.id,
            packageName: pkg.name,
            includedTests: pkg.tests || [] // Use the tests from the transformed package
          };

          console.log('Fallback cart item to add:', cartItem);

          const newCart = [...currentCart, cartItem];
          localStorage.setItem(cartKey, JSON.stringify(newCart));
          window.dispatchEvent(new Event('cartUpdated'));
          alert(`${pkg.name} has been added to your cart!`);
        }
      } catch (error) {
        console.error('Error fetching package details:', error);
        // Fallback if we can't fetch full package details
        const cartItem = {
          id: Date.now(),
          testName: pkg.name,
          category: "Health Package",
          price: parseFloat(pkg.originalPrice.replace(/[^\d.]/g, '')),
          isPackage: true,
          packageId: pkg.id,
          packageName: pkg.name,
          includedTests: pkg.tests || [] // Use the tests from the transformed package
        };

        console.log('Error fallback cart item to add:', cartItem);

        const newCart = [...currentCart, cartItem];
        localStorage.setItem(cartKey, JSON.stringify(newCart));
        window.dispatchEvent(new Event('cartUpdated'));
        alert(`${pkg.name} has been added to your cart!`);
      }
    }
  }, 'Please log in or sign up to book this package');

  // Transform health packages to match the existing structure
  const packages = healthPackages.map((pkg, index) => {
    const discountedPrice = pkg.price * (1 - (pkg.discount || 0) / 100);

    // Extract test names from includedTests (which might be objects or strings)
    const testNames = (pkg.includedTests || []).map(test => {
      if (typeof test === 'string') {
        return test;
      } else if (test && test.testName) {
        return test.testName;
      } else if (test && test.name) {
        return test.name;
      } else {
        return 'Test';
      }
    });

    return {
      id: pkg._id || index, // Use the package ID or index as fallback
      name: pkg.title || 'Health Package',
      originalPrice: `₹${(pkg.price || 0).toLocaleString()}`,
      discountedPrice: `₹${discountedPrice.toLocaleString()}`,
      discount: pkg.discount ? `${pkg.discount}% OFF` : 'Special Offer',
      popular: pkg.isMostPopular || false,
      description: pkg.subTitle || "Comprehensive health package",
      tests: testNames,
      includes: pkg.packageIncludes || []
    };
  });



  return (
    <section id="packages" className="py-12 bg-white">
      <div className="max-w-full mx-auto px-2 sm:px-3 lg:px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Health <span className="text-[#007AFF]">Packages</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Comprehensive health checkup packages designed to give you complete insights into your health status at affordable prices.
          </p>
        </div>

        <div className="carousel-container relative px-20">
          <div className="embla" ref={emblaRef}>
            <div className="embla__container flex">
              {packages.map((pkg, index) => (
                <div className="embla__slide flex-shrink-0 w-full sm:w-1/2 lg:w-1/3 px-6" key={index}>
                  <div
                    className={`relative rounded-2xl shadow-xl transition-all duration-300 transform hover:-translate-y-2 h-full ${pkg.popular
                      ? 'bg-gradient-to-b from-[#00CCFF] to-white border-2 border-[#007AFF] scale-105'
                      : 'bg-white border border-gray-200'
                      }`}
                  >
                    {pkg.popular && (
                      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                        <div className="bg-gradient-to-r from-[#007AFF] to-[#0052FF] text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center space-x-1">
                          <Star className="h-4 w-4" />
                          <span>Most Popular</span>
                        </div>
                      </div>
                    )}

                    <div className="p-6">
                      <div className="text-center mb-4">
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">{pkg.name}</h3>
                        <p className="text-gray-600 mb-4">{pkg.description}</p>

                        <div className="flex items-center justify-center space-x-2 mb-4">
                          <span className="text-3xl font-bold text-[#0052FF]">{pkg.discountedPrice}</span>
                          <span className="text-lg text-gray-500 line-through">{pkg.originalPrice}</span>
                        </div>

                        <div className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                            {pkg.discount}
                        </div>
                      </div>

                      <div className="space-y-3 mb-4">
                        <h4 className="font-semibold text-gray-900">Tests Included:</h4>
                              {pkg.tests.map((test, idx) => (
                          <div key={idx} className="flex items-start space-x-2">
                            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-700 text-sm">{test}</span>
                          </div>
                        ))}
                      </div>

                      <div className="space-y-3 mb-6">
                        <h4 className="font-semibold text-gray-900">Package Includes:</h4>
                              {pkg.includes.map((include, idx) => (
                          <div key={idx} className="flex items-start space-x-2">
                            <CheckCircle className="h-5 w-5 text-[#007AFF] mt-0.5 flex-shrink-0" />
                            <span className="text-gray-700 text-sm">{include}</span>
                          </div>
                        ))}
                      </div>

                        <button
                        className={`w-full py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 ${pkg.popular
                          ? 'bg-gradient-to-r from-[#007AFF] to-[#0052FF] text-white hover:from-[#0052FF] hover:to-[#0000FF]'
                          : 'bg-gradient-to-r from-gray-800 to-black text-white hover:from-black hover:to-gray-800'
                            }`}
                          onClick={() => addToCart(pkg)}
                        >
                        Book Package
                        </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {packages.length > 3 && (
            <>
              <button
                className="embla__prev absolute left-8 top-1/2 transform -translate-y-1/2 bg-white rounded-full p-3 shadow-md hover:bg-gray-100 transition-all z-10"
                onClick={scrollPrev}
              >
                <ChevronLeft className="w-6 h-6 text-gray-800" />
              </button>
              <button
                className="embla__next absolute right-8 top-1/2 transform -translate-y-1/2 bg-white rounded-full p-3 shadow-md hover:bg-gray-100 transition-all z-10"
                onClick={scrollNext}
              >
                <ChevronRight className="w-6 h-6 text-gray-800" />
              </button>
            </>
          )}
        </div>
      </div>
    </section>
  )
}

export default Packages