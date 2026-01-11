'use client';
import { useState, useCallback, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, ShoppingCart } from 'lucide-react';
import { MapPin } from 'lucide-react';
import useEmblaCarousel from 'embla-carousel-react';
import Navbar from '../../page'; 
import Footer from '../../Footer/page';
import { withAuth } from '../../../utils/authGuard';

// Sample content data for the carousel
const heroContent = [
  {
    id: 1,
    priorityText: "Your health is our top priority",
    titleLine1: "Men’s Health: Take Control of your  ",
    titleLine2: " wellness",
    description: "From preventative care to advanced diagnostics, find the right tests, packages to support your goals. proactive care is best care",
    buttonText: "Book Tests",
    image: "/Category/men/men1.jpg"
  },
   {
    id: 2,
    priorityText: "Your health is our top priority",
    titleLine1: "Men’s Health: Take Control of your  ",
    titleLine2: " wellness",
    description: "From preventative care to advanced diagnostics, find the right tests, packages to support your goals. proactive care is best care",
    buttonText: "Book Tests",
    image: "/Category/men/men1.jpg"
  },  {
    id: 3,
    priorityText: "Your health is our top priority",
    titleLine1: "Men’s Health: Take Control of your  ",
    titleLine2: " wellness",
    description: "From preventative care to advanced diagnostics, find the right tests, packages to support your goals. proactive care is best care",
    buttonText: "Book Tests",
    image: "/Category/men/men1.jpg"
  },
];

// Simple icon components
const Heart = ({ className }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
  </svg>
);

const Bone = ({ className }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm0 18c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm0-9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
  </svg>
);

const Droplets = ({ className }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2c-5.33 4.55-8 8.48-8 11.8 1.73 4.39 6 7.5 11 7.5s9.27-3.22 11-8.2c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
  </svg>
);

const Brain = ({ className }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.22 11-8.2c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
  </svg>
);

const Play = ({ className }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M8 5v14l11-7z"/>
  </svg>
);

// Simple components to replace UI library components
const Card = ({ children, className }) => (
  <div className={className}>
    {children}
  </div>
);

const CardHeader = ({ children }) => (
  <div>
    {children}
  </div>
);

const CardTitle = ({ children, className }) => (
  <h3 className={className}>
    {children}
  </h3>
);

const CardContent = ({ children }) => (
  <div>
    {children}
  </div>
);

const Button = ({ children, className, onClick }) => (
  <button className={className} onClick={onClick}>
    {children}
  </button>
);

const Accordion = ({ children, type, collapsible, className }) => (
  <div className={className}>
    {children}
  </div>
);

const AccordionItem = ({ children, value, className }) => (
  <div className={className}>
    {children}
  </div>
);

const AccordionTrigger = ({ children, className }) => (
  <div className={className}>
    {children}
  </div>
);

const AccordionContent = ({ children, className }) => (
  <div className={className}>
    {children}
  </div>
);

export default function MenCategory() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeVideo, setActiveVideo] = useState(null);
  const [openFaqId, setOpenFaqId] = useState(null);
  const [labTestOptions, setLabTestOptions] = useState([]);
  const [focusAreas, setFocusAreas] = useState([]);
  const [packages, setPackages] = useState([]);
  const [videos, setVideos] = useState([]);
  const [faqData, setFaqData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTestPopup, setShowTestPopup] = useState(false);
    const [popupType, setPopupType] = useState('brain'); // 'brain' or 'heart'
  
  // Initialize separate embla carousels
  const [testsEmblaRef, testsEmblaApi] = useEmblaCarousel({
    loop: true,
    align: 'start',
    slidesToScroll: 1,
    containScroll: 'trimSnaps'
  });

  const [packagesEmblaRef, packagesEmblaApi] = useEmblaCarousel({
    loop: true,
    align: 'start',
    slidesToScroll: 1,
    containScroll: 'trimSnaps'
  });

  const scrollTestsPrev = useCallback(() => {
    if (testsEmblaApi) testsEmblaApi.scrollPrev();
  }, [testsEmblaApi]);

  const scrollTestsNext = useCallback(() => {
    if (testsEmblaApi) testsEmblaApi.scrollNext();
  }, [testsEmblaApi]);

  const scrollPackagesPrev = useCallback(() => {
    if (packagesEmblaApi) packagesEmblaApi.scrollPrev();
  }, [packagesEmblaApi]);

  const scrollPackagesNext = useCallback(() => {
    if (packagesEmblaApi) packagesEmblaApi.scrollNext();
  }, [packagesEmblaApi]);

  const goToPrevious = () => {
    const isFirstSlide = currentIndex === 0;
    const newIndex = isFirstSlide ? heroContent.length - 1 : currentIndex - 1;
    setCurrentIndex(newIndex);
  };

  const goToNext = () => {
    const isLastSlide = currentIndex === heroContent.length - 1;
    const newIndex = isLastSlide ? 0 : currentIndex + 1;
    setCurrentIndex(newIndex);
  };

  const currentContent = heroContent[currentIndex];

  // Icon mapping
  const iconMap = {
    Heart,
    Bone,
    Droplets,
    Brain
  };

  const iconBgMap = {
    Heart: 'bg-red-100 text-red-600',
    Bone: 'bg-yellow-100 text-yellow-600',
    Droplets: 'bg-blue-100 text-blue-600',
    Brain: 'bg-[#00CCFF] text-[#0052FF]'
  };

    const imageMap = {
      '1': '/Category/men/Heart.png',
      '2': '/Category/men/energy.png',
      '3': '/Category/men/Metabolism.png',
      '4': '/Category/men/Cognitive.png',
      '5': '/Category/men/Prostate.png',
      '6': '/Category/men/mental.png'
    };

  // Function to toggle FAQ items
  const toggleFaq = (id) => {
    setOpenFaqId(openFaqId === id ? null : id);
  };

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch tests for men category
        const testsResponse = await fetch('/api/tests?category=Men');
        const testsData = await testsResponse.json();
        
        // Fetch packages for men category
        const packagesResponse = await fetch('/api/packages?category=Men');
        const packagesData = await packagesResponse.json();
        
        // Fetch videos for men category
        const videosResponse = await fetch('/api/videos?category=Men');
        const videosData = await videosResponse.json();
        
        // Fetch FAQs for men category
        const faqsResponse = await fetch('/api/faqs?category=Men&status=Active');
        const faqsData = await faqsResponse.json();
        
        if (testsData.success) {
          // Map tests to labTestOptions format
          const mappedTests = testsData.tests.map((test, index) => ({
            id: test._id,
            title: test.testName,
            type: "men",
            description: test.description || "No description available",
            price: `₹${test.price}`,
            available: `Available at ${test.availableAtLabs ? test.availableAtLabs.split(',').length : 0} labs`,
            popular: test.isPopular || false
          }));
          
          setLabTestOptions(mappedTests);
        }
        
        if (packagesData.success) {
          // Map packages to packagesData format
          const mappedPackages = packagesData.data.map((pkg, index) => ({
            id: pkg._id,
            title: pkg.packageName,
            subtitle: `Tests Included: ${pkg.includedTests ? pkg.includedTests.length : 0}`,
            badge: pkg.discount ? `${pkg.discount}% OFF` : "",
            price: pkg.price
          }));
          
          setPackages(mappedPackages);
        }
        
        // Set videos data
        if (videosData.success) {
          setVideos(videosData.data);
          if (videosData.data.length > 0) {
            setActiveVideo(videosData.data[0]);
          }
        }
        
        // For focus areas, we'll use a predefined list but with real data
        const focusAreasData = [
          {
            id: 1,
            title: "Heart Health",
            description: "Know your risk. Manage cholesterol, inflammation, and blood pressure.",
          },
          {
            id: 2,
            title: "Hormone & Energy",
            description: "Beat the fatigue. Check T-levels, thyroid function, and key vitamin deficiencies.",
          },
          {
            id: 3,
            title: "Metabolic Health",
            description: "Metabolic health means your body efficiently turns food into energy while keeping blood sugar, cholesterol, and blood pressure within healthy ranges. ",
          },
          {
            id: 4,
            title: "Cognitive Wellness",
            description: "Participating in mental activities, social interactions, and regular neurological checkups helps enhance memory, concentration, and overall brain wellness.",
          },
          {
            id: 5,
            title: "Prostate & Uro",
            description: "Prostate and Urological (Uro) health focuses on the organs of the male urinary and reproductive systems, which include the prostate gland, bladder, kidneys, and urinary tract. Maintaining good prostate and uro health is essential for proper urination, sexual function, and overall well-being.",
          },
          {
            id: 6,
            title: "Mental Wellness",
            description: "Stress, sleep, and mood are all part of your health. Check cortisol & key nutrients.",
          }
        ];
        
        setFocusAreas(focusAreasData);
        
        // Filter FAQs by category
        if (faqsData.success) {
          setFaqData(faqsData.data);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#3A6EA5] to-white via-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#007AFF] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading men's health data...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-b from-[#A8C3A3] to-white via-white" style={{ 
        background: 'linear-gradient(to bottom, #3A6EA5 0%, #FFFFFF 48%)' 
      }}>
        <Navbar />


        {/* Hero Section */}
        <section className="py-8">
          <div className="container mx-auto px-10">
            <div className="bg-white rounded-xl shadow-lg max-w-8xl relative">
              {/* Left Arrow */}
              <button 
                onClick={goToPrevious}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 bg-white bg-opacity-50 rounded-full p-2 shadow-md hover:bg-opacity-75 transition-all"
                aria-label="Previous slide"
              >
                <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              {/* Right Arrow */}
              <button 
                onClick={goToNext}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 bg-white bg-opacity-50 rounded-full p-2 shadow-md hover:bg-opacity-75 transition-all"
                aria-label="Next slide"
              >
                <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              
              <div className="flex flex-col lg:flex-row items-center justify-between gap-4">

                <div className="lg:w-1/3 flex justify-center">
                  <div className="relative">
                    <div className="w-64 h-64 bg-gradient-to-br from-[#007AFF] to-[#007AFF] rounded-full absolute -z-10 top-0 left-0"></div>
                    <img 
                      src={currentContent.image}
                      alt="Professional Doctor"
                      className="w-75 h-90"
                    />
                  </div>
                </div>
                
                <div className="lg:w-2/3 text-center lg:text-left">
                  <p className="text-red-600 font-semibold mb-2">{currentContent.priorityText}</p>
                  <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
                    <span className="text-green-700 font-semibold mb-3" style={{ lineHeight: '1.0' }}>{currentContent.titleLine1} </span><br />
                    <span className="text-green-700 font-semibold" style={{ lineHeight: '1.0' }}>{currentContent.titleLine2}</span>
                  </h1>
                  <p className="text-gray-600 text-lg mb-6 max-w-3xl">
                    {currentContent.description}
                  </p>
                  <button className="bg-[#007AFF] hover:from-[#007AFF] text-white px-8 py-4 text-lg rounded-lg transition-all transform hover:scale-105">
                    {currentContent.buttonText}
                  </button>
                </div>
              </div>
              
              {/* Indicators */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                {heroContent.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`w-3 h-3 rounded-full ${
                      index === currentIndex ? 'bg-[#007AFF]' : 'bg-gray-300'
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Key Focus Areas */}
      <section id="focus-areas" className="py-12">
        <div className="container mx-auto px-10">
          <h2 className="text-2xl lg:text-4xl font-bold text-gray-900 mb-12 text-left">
            Key Focus Areas for Men's Health
          </h2>
          
          <div className="flex flex-col lg:flex-row gap-12 items-start">
            <div className="lg:w-2/3">
              {/* Grid layout using CSS Grid for precise control */}
              <div className="grid grid-cols-3 gap-6 auto-rows-max">
                {/* Row 1: Cards 1, 2, 3 - equal size */}
                {focusAreas.slice(0, 3).map((area) => {
                  return (
                    <Card
                      key={area.id}
                      className="bg-white rounded-3xl p-6 border-2 border-green-200 shadow-md hover:shadow-lg hover:border-green-300 transition"
                    >
                      <CardHeader>
                        <div className="flex flex-col items-center text-center gap-4">
                            <img 
                              src={imageMap[String(area.id)]} 
                              alt={area.title}
                              className="w-16 h-16 rounded-2xl object-cover"
                            />
                          <div className="flex-1 w-full">
                            <CardTitle className="text-base font-bold text-gray-900 mb-3">{area.title}</CardTitle>
                            <CardContent>
                              <p className="text-gray-600 text-xs leading-relaxed">{area.description}</p>
                            </CardContent>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  );
                })}
                
                {/* Row 2: Card 4 (spans 2 columns) and Card 5 (1 column) */}
                {focusAreas.slice(3, 5).map((area) => {
                  const isCard4 = area.id === 4;
                  const isCard5 = area.id === 5;
                  
                  return (
                    <Card
                      key={area.id}
                      className={`bg-white rounded-3xl p-6 border-2 border-green-200 shadow-md hover:shadow-lg hover:border-green-300 transition ${
                        isCard4 ? 'col-span-2' : 'col-span-1'
                      } ${isCard5 ? 'row-span-2' : ''}`}
                    >
                      <CardHeader>
                        {isCard5 ? (
                          // Card 5: Vertical layout with icon on top
                          <div className="flex flex-col items-center text-center gap-4 h-full">
                              <img 
                                src={imageMap[String(area.id)]} 
                                alt={area.title}
                                className="w-14 h-14 rounded-xl object-cover"
                              />
                            <div className="flex-1 w-full">
                              <CardTitle className="text-sm font-bold text-gray-900 mb-2">{area.title}</CardTitle>
                              <CardContent>
                                <p className="text-gray-600 text-xs leading-relaxed">{area.description}</p>
                              </CardContent>
                            </div>
                          </div>
                        ) : (
                          // Card 4: Horizontal layout
                          <div className="flex items-start gap-4">
                              <img 
                                src={imageMap[String(area.id)]} 
                                alt={area.title}
                                className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
                              />
                            <div className="flex-1">
                              <CardTitle className="text-sm font-bold text-gray-900 mb-2">{area.title}</CardTitle>
                              <CardContent>
                                <p className="text-gray-600 text-xs leading-relaxed">{area.description}</p>
                              </CardContent>
                            </div>
                          </div>
                        )}
                      </CardHeader>
                    </Card>
                  );
                })}
                
                {/* Row 3: Card 6 (spans 2 columns) */}
                {focusAreas.slice(5, 6).map((area) => {
                  
                  return (
                    <Card
                      key={area.id}
                      className="bg-white rounded-3xl p-6 border-2 border-green-200 shadow-md hover:shadow-lg hover:border-green-300 transition col-span-2"
                    >
                      <CardHeader>
                        <div className="flex items-start gap-4">
                            <img 
                              src={imageMap[String(area.id)]} 
                              alt={area.title}
                              className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
                            />
                          <div className="flex-1">
                            <CardTitle className="text-sm font-bold text-gray-900 mb-2">{area.title}</CardTitle>
                            <CardContent>
                              <p className="text-gray-600 text-xs leading-relaxed">{area.description}</p>
                            </CardContent>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  );
                })}
              </div>
            </div>
            
            <div className="lg:w-1/3 flex justify-center items-start pt-4 relative">
              <img
                src="/Category/men/men2.png"
                alt="Men's Health"
                className="h-auto max-h-[500px] object-contain"
              />
              {/* Red dot button for quick tests popup - Brain */}
              <button 
                className="absolute top-15 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-5 h-5 bg-red-500 rounded-full shadow-lg z-10 flex items-center justify-center text-white font-bold text-xl hover:bg-red-600 transition-colors"
                onClick={() => {
                  setPopupType('brain');
                  setShowTestPopup(!showTestPopup);
                }}
              >
                •
              </button>
              {/* Second button for Heart tests */}
              <button 
                className="absolute top-35 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-5 h-5 bg-red-500 rounded-full shadow-lg z-10 flex items-center justify-center text-white font-bold text-xl hover:bg-red-600 transition-colors"
                onClick={() => {
                  setPopupType('heart');
                  setShowTestPopup(!showTestPopup);
                }}
              >
                •
              </button>
              {/* Third button for Lungs tests */}
              <button 
                className="absolute top-43 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-5 h-5 bg-red-500 rounded-full shadow-lg z-10 flex items-center justify-center text-white font-bold text-xl hover:bg-red-600 transition-colors"
                onClick={() => {
                  setPopupType('lungs');
                  setShowTestPopup(!showTestPopup);
                }}
              >
                •
              </button>
              {/* Fourth button */}
              <button 
                className="absolute top-65 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-5 h-5 bg-red-500 rounded-full shadow-lg z-10 flex items-center justify-center text-white font-bold text-xl hover:bg-red-600 transition-colors"
                onClick={() => {
                  setPopupType('fourth');
                  setShowTestPopup(!showTestPopup);
                }}
              >
                •
              </button>

              {/* Quick Tests Popup */}
              {showTestPopup && (
                <div className="absolute top-1/2 left-1/2 transform -translate-x-full -translate-y-1/2 bg-white rounded-lg shadow-xl z-10 w-72 border border-gray-200 mr-4">
                  <div className="p-3">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-md font-bold text-gray-900">Men Test</h3>
                      <button 
                        className="text-gray-500 hover:text-gray-700"
                        onClick={() => setShowTestPopup(false)}
                      >
                        ✕
                      </button>
                    </div>
                    {popupType === 'brain' ? (
                      <>
                        <h4 className="text-sm font-bold text-gray-800 mb-1">Brain</h4>
                        <p className="text-gray-600 text-xs mb-3">
                          The brain is a soft complex organ made of billions of nerve cells (neurons). It sits inside your skull and works like the master computer of your body. It receives information, processes it, and sends instructions to every part of the body.
                        </p>
                        <div className="max-h-80 overflow-y-auto">
                          {labTestOptions
                            .filter(test => test.title.includes('Montreal Cognitive Assessment') || test.title.includes('MoCA'))
                            .slice(0, 1)
                            .map((test) => (
                              <div key={test.id} className="py-2 border-b border-gray-100 last:border-0">
                                <div className="flex justify-between items-center">
                                  <div>
                                    <h4 className="font-medium text-gray-900 text-sm">{test.title}</h4>
                                  </div>
                                </div>
                                <div className="flex justify-between items-center mt-2">
                                  <div className="mt-1">
                                    <p className="text-sm font-medium text-gray-900">{test.price}</p>
                                  </div>
                                  <button 
                                    className="text-[#007AFF] hover:text-[#0052FF] text-xs font-medium"
                                    onClick={() => {
                                      const url = `/Patients/FindTests/content?testName=${encodeURIComponent(test.title)}&testId=${test.id}`;
                                      window.location.href = url;
                                    }}
                                  >
                                    View Test
                                  </button>
                                </div>
                              </div>
                            ))}
                          {labTestOptions.filter(test => test.title.includes('Montreal Cognitive Assessment') || test.title.includes('MoCA')).length === 0 && (
                            <p className="text-gray-500 text-center py-2 text-sm">Loading tests...</p>
                          )}
                        </div>
                      </>
                    ) : popupType === 'heart' ? (
                      <>
                        <h4 className="text-sm font-bold text-gray-800 mb-1">Heart</h4>
                        <p className="text-gray-600 text-xs mb-3">
                          The heart is a muscular organ that works like the pump of your body. Its main job is to push blood through your blood vessels so that every cell in your body gets oxygen and nutrients, and waste products are removed.
                        </p>
                        <div className="max-h-80 overflow-y-auto">
                          {labTestOptions
                            .filter(test => test.title.toLowerCase().includes('ecg') || test.title.toLowerCase().includes('electrocardiogram') || test.title.toLowerCase().includes('heart') || test.title.toLowerCase().includes('cardio'))
                            .slice(0, 1)
                            .map((test) => (
                              <div key={test.id} className="py-2 border-b border-gray-100 last:border-0">
                                <div className="flex justify-between items-center">
                                  <div>
                                    <h4 className="font-medium text-gray-900 text-sm">{test.title}</h4>
                                  </div>
                                </div>
                                <div className="flex justify-between items-center mt-2">
                                  <div className="mt-1">
                                    <p className="text-sm font-medium text-gray-900">{test.price}</p>
                                  </div>
                                  <button 
                                    className="text-[#007AFF] hover:text-[#0052FF] text-xs font-medium"
                                    onClick={() => {
                                      const url = `/Patients/FindTests/content?testName=${encodeURIComponent(test.title)}&testId=${test.id}`;
                                      window.location.href = url;
                                    }}
                                  >
                                    View Test
                                  </button>
                                </div>
                              </div>
                            ))}
                          {labTestOptions.filter(test => test.title.toLowerCase().includes('ecg') || test.title.toLowerCase().includes('electrocardiogram') || test.title.toLowerCase().includes('heart') || test.title.toLowerCase().includes('cardio')).length === 0 && (
                            <p className="text-gray-500 text-center py-2 text-sm">Loading tests...</p>
                          )}
                        </div>
                      </>
                    ) : popupType === 'lungs' ? (
                      <>
                        <h4 className="text-sm font-bold text-gray-800 mb-1">Lungs</h4>
                        <p className="text-gray-600 text-xs mb-3">
                          The lungs are the main breathing organs in your body. Their job is to bring oxygen in and push carbon dioxide out. Every time you breathe, your lungs take in fresh air and remove waste gases to keep your body alive and healthy.
                        </p>
                        <div className="max-h-80 overflow-y-auto">
                          {labTestOptions
                            .filter(test => test.title.includes('Pulmonary Function Test') || test.title.includes('Lung Function Test'))
                            .slice(0, 1)
                            .map((test) => (
                              <div key={test.id} className="py-2 border-b border-gray-100 last:border-0">
                                <div className="flex justify-between items-center">
                                  <div>
                                    <h4 className="font-medium text-gray-900 text-sm">{test.title}</h4>
                                  </div>
                                </div>
                                <div className="flex justify-between items-center mt-2">
                                  <div className="mt-1">
                                    <p className="text-sm font-medium text-gray-900">{test.price}</p>
                                  </div>
                                  <button 
                                    className="text-[#007AFF] hover:text-[#0052FF] text-xs font-medium"
                                    onClick={() => {
                                      const url = `/Patients/FindTests/content?testName=${encodeURIComponent(test.title)}&testId=${test.id}`;
                                      window.location.href = url;
                                    }}
                                  >
                                    View Test
                                  </button>
                                </div>
                              </div>
                            ))}
                          {labTestOptions.filter(test => test.title.includes('Pulmonary Function Test') || test.title.includes('Lung Function Test')).length === 0 && (
                            <p className="text-gray-500 text-center py-2 text-sm">Loading tests...</p>
                          )}
                        </div>
                      </>
                    ) : (
                      <>
                        <h4 className="text-sm font-bold text-gray-800 mb-1">Male Reproductive System Tests</h4>
                        <p className="text-gray-600 text-xs mb-3">
                          The male reproductive system consists of internal and external organs that work together to produce, store, and deliver sperm for reproduction. Key components include the testes, epididymis, vas deferens, seminal vesicles, prostate gland, and penis.
                        </p>
                        <div className="max-h-80 overflow-y-auto">
                          {labTestOptions
                            .filter(test => test.title.toLowerCase().includes('reproductive') || test.title.toLowerCase().includes('prostate') || test.title.toLowerCase().includes('testosterone') || test.title.toLowerCase().includes('male'))
                            .slice(0, 1)
                            .map((test) => (
                              <div key={test.id} className="py-2 border-b border-gray-100 last:border-0">
                                <div className="flex justify-between items-center">
                                  <div>
                                    <h4 className="font-medium text-gray-900 text-sm">{test.title}</h4>
                                  </div>
                                </div>
                                <div className="flex justify-between items-center mt-2">
                                  <div className="mt-1">
                                    <p className="text-sm font-medium text-gray-900">{test.price}</p>
                                  </div>
                                  <button 
                                    className="text-[#007AFF] hover:text-[#0052FF] text-xs font-medium"
                                    onClick={() => {
                                      const url = `/Patients/FindTests/content?testName=${encodeURIComponent(test.title)}&testId=${test.id}`;
                                      window.location.href = url;
                                    }}
                                  >
                                    View Test
                                  </button>
                                </div>
                              </div>
                            ))}
                          {labTestOptions.filter(test => test.title.toLowerCase().includes('reproductive') || test.title.toLowerCase().includes('prostate') || test.title.toLowerCase().includes('testosterone') || test.title.toLowerCase().includes('male')).length === 0 && (
                            <p className="text-gray-500 text-center py-2 text-sm">Loading tests...</p>
                          )}
                        </div>
                      </>
                    )}
                    </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Book Lab Tests */}
      <section id="tests" className="py-8">
        <div className="container mx-auto px-10">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-12 text-center">
            Book Lab tests
          </h2>
          
          <div className="carousel-container relative">
            <div className="embla" ref={testsEmblaRef}>
              <div className="embla__container flex">
                {labTestOptions.map((test) => (
                  <div className="embla__slide flex-shrink-0 w-1/4 px-2" key={test.id}>
                    <Card 
                      key={test.id} 
                      className="hover:shadow-xl transition-all hover:-translate-y-1 bg-[#80BCFF] rounded-xl p-6 h-full cursor-pointer"
                      onClick={() => {
                        // Navigate to the test content page with the test name and ID
                        const url = `/Patients/FindTests/content?testName=${encodeURIComponent(test.title)}&testId=${test.id}`;
                        window.location.href = url;
                      }}
                    >
                      <CardHeader>
                        <div className="flex items-center justify-between mb-2">
                          <span className="bg-[#007AFF] text-white px-3 py-1 rounded-full text-sm font-semibold inline-block mb-5 w-fit">
                            {test.type}
                          </span>
                          {test.popular && (
                            <span className="bg-[#00CCFF] text-[#0052FF] border-2 border-[#007AFF] px-3 py-1 rounded-full text-xs font-medium inline-block mb-5 w-fit">
                              Popular
                            </span>
                          )}
                        </div>
                        <CardTitle className="text-lg font-bold text-black-900 mb-3">{test.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                          {test.description}
                        </p>
                        <p 
                          className="text-blue-600 text-sm cursor-pointer hover:underline mb-4"
                          onClick={(e) => {
                            // Prevent card click when clicking on Read More
                            e.stopPropagation();
                            // Navigate to the test content page with the test name and ID
                            const url = `/Patients/FindTests/content?testName=${encodeURIComponent(test.title)}&testId=${test.id}`;
                            window.location.href = url;
                          }}
                        >
                          Read More
                        </p>

                        <p className="text-black-900 font-semibold text-xl mb-4">
                          {test.price}
                          <span className="text-sm">.Avg</span>
                        </p>
                        <div className="flex items-center text-gray-500 text-sm mb-3">
                          <MapPin className="w-4 h-4 mr-1" />
                          <span>{test.available}</span>
                        </div>
                        <div className="flex items-center">
                          <Button 
                            className="bg-white text-black border border-black transition-colors py-2 px-20 rounded-lg font-medium whitespace-nowrap"
                            onClick={(e) => {
                              // Prevent card click when clicking on View details button
                              e.stopPropagation();
                              // Navigate to the test content page with the test name and ID
                              const url = `/Patients/FindTests/content?testName=${encodeURIComponent(test.title)}&testId=${test.id}`;
                              window.location.href = url;
                            }}
                          >
                            View details
                          </Button>
                          <div className="flex items-center ml-8 text-[#0052FF] text-sm">
                            <ShoppingCart 
                              className="w-4 h-4 mr-1 cursor-pointer hover:text-[#0052FF] transition-colors" 
                              onClick={withAuth((e) => {
                                // Prevent card click when clicking on cart icon
                                e.stopPropagation();
                                
                                // Add to cart functionality
                                // Get user ID for cart key
                                const getUserId = () => {
                                  if (typeof window !== 'undefined') {
                                    const user = JSON.parse(localStorage.getItem('user') || '{}');
                                    return user.id || user.email || user.phone || 'guest';
                                  }
                                  return 'guest';
                                };
                                
                                const cartKey = `cart_${getUserId()}`;
                                
                                const cartItem = {
                                  id: test.id,
                                  testName: test.title,
                                  price: test.price,
                                  // Ensure category is a string, not an array
                                  category: Array.isArray(test.type) ? test.type.join(', ') : (test.type || 'General'),
                                  description: test.description
                                };
                                
                                // Get existing cart items from localStorage
                                const existingCart = JSON.parse(localStorage.getItem(cartKey) || '[]');
                                
                                // Check if item already exists in cart
                                const itemExists = existingCart.find(item => item.id === cartItem.id);
                                
                                if (itemExists) {
                                  // If item exists, you might want to increase quantity or show a message
                                  console.log(`${test.title} is already in the cart`);
                                } else {
                                  // Add new item to cart
                                  existingCart.push(cartItem);
                                  localStorage.setItem(cartKey, JSON.stringify(existingCart));
                                  // Dispatch event to notify other components of cart update
                                  window.dispatchEvent(new Event('cartUpdated'));
                                  console.log(`Added ${test.title} to cart`);
                                }
                              }, 'Please log in or sign up to add items to your cart')}
                            />
                          </div>
                        </div>

                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            </div>

            <button 
              className="embla__prev absolute left-4 top-1/2 transform -translate-y-1/2 bg-white rounded-full p-2 shadow-md hover:bg-gray-100 transition-all z-10"
              onClick={scrollTestsPrev}
            >
              <ChevronLeft className="w-6 h-6 text-gray-800" />
            </button>
            <button 
              className="embla__next absolute right-4 top-1/2 transform -translate-y-1/2 bg-white rounded-full p-2 shadow-md hover:bg-gray-100 transition-all z-10"
              onClick={scrollTestsNext}
            >
              <ChevronRight className="w-6 h-6 text-gray-800" />
            </button>
          </div>
        </div>
      </section>

      {/* Packages */}
      <section id="packages" className="py-8">
        <div className="container mx-auto px-10">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-12 text-center">
            Packages
          </h2>
          
          <div className="carousel-container relative">
            <div className="embla" ref={packagesEmblaRef}>
              <div className="embla__container flex">
                {packages.map((pkg) => (
                  <div className="embla__slide flex-shrink-0 w-1/4 px-2" key={pkg.id}>
                    <Card className="hover:shadow-xl transition-all hover:-translate-y-1 bg-gradient-to-br from-[#80BCFF] to-[#80BCFF] text-white rounded-xl p-6 h-full">
                      <CardHeader>
                        {pkg.badge && (
                          <span className="bg-[#11B003] text-white px-3 py-1 rounded-full text-xs font-semibold inline-block mb-5 w-fit">
                            {pkg.badge}
                          </span>
                        )}
                        <CardTitle className="text-xl text-black font-bold">{pkg.title}</CardTitle>
                        <p className="text-gray-600 font-semibold text-sm mt-2">{pkg.subtitle}</p>
                        <p className="text-black-900 font-semibold text-xl mt-4">
                          ₹{pkg.price}
                        </p>
                      </CardHeader>
                      <CardContent className="mt-6">
                        <Button 
                          className="bg-white text-black border border-black transition-colors font-semibold py-2 px-4 rounded-lg mt-5"
                          onClick={withAuth(() => {
                            // Navigate to the package content page with the package name and ID
                            const url = `/Patients/packages/content?packageName=${encodeURIComponent(pkg.title)}&packageId=${pkg.id}`;
                            window.location.href = url;
                          }, 'Please log in or sign up to view package details')}
                        >
                          View Package
                        </Button>
                      </CardContent>

                    </Card>
                  </div>
                ))}
              </div>
            </div>

            <button 
              className="embla__prev absolute left-4 top-1/2 transform -translate-y-1/2 bg-white rounded-full p-2 shadow-md hover:bg-gray-100 transition-all z-10"
              onClick={scrollPackagesPrev}
            >
              <ChevronLeft className="w-6 h-6 text-gray-800" />
            </button>
            <button 
              className="embla__next absolute right-4 top-1/2 transform -translate-y-1/2 bg-white rounded-full p-2 shadow-md hover:bg-gray-100 transition-all z-10"
              onClick={scrollPackagesNext}
            >
              <ChevronRight className="w-6 h-6 text-gray-800" />
            </button>
          </div>
        </div>
      </section>

      {/* Video Hub */}
      <section className="py-8">
        <div className="container mx-auto px-10">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4 text-center">
            The 2-Minute Men's Health Hub
          </h2>
          <p className="text-gray-600 text-center mb-8">
            Watch quick, expert-led Q&As on the topics that matter most to you.
          </p>
          
          <div className="flex flex-col lg:flex-row gap-12">
            <div className="lg:w-2/3">
              {activeVideo ? (
                <div className="bg-black rounded-xl overflow-hidden aspect-video relative">
                  {activeVideo.videoLink ? (
                    (() => {
                      // Check if it's a YouTube URL
                      const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/;
                      if (youtubeRegex.test(activeVideo.videoLink)) {
                        // Extract YouTube video ID
                        const videoId = activeVideo.videoLink.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&\n?#]+)/);
                        if (videoId && videoId[1]) {
                          return (
                            <iframe
                              className="w-full h-full"
                              src={`https://www.youtube.com/embed/${videoId[1]}?rel=0`}
                              title={activeVideo.name}
                              frameBorder="0"
                              allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            ></iframe>
                          );
                        }
                      }
                      // For other video URLs, try to embed them directly
                      return (
                        <video 
                          className="w-full h-full object-cover"
                          controls
                          src={activeVideo.videoLink}
                        >
                          Your browser does not support the video tag.
                        </video>
                      );
                    })()
                  ) : (
                    <div className="bg-black rounded-xl overflow-hidden aspect-video flex items-center justify-center relative group cursor-pointer">
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                      <Play className="w-16 h-16 text-white absolute z-10 group-hover:scale-110 transition-transform" />
                      <div className="absolute bottom-4 left-4 text-white z-10">
                        <p className="text-sm opacity-90">Now Playing</p>
                        <h3 className="text-lg font-semibold">{activeVideo.name}</h3>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-gray-200 rounded-xl overflow-hidden aspect-video flex items-center justify-center">
                  <p className="text-gray-500">No videos available</p>
                </div>
              )}
            </div>
            
            <div className="lg:w-1/3">
                <div className="bg-white-50 rounded-xl p-6">
                  <h3 className="font-bold text-gray-900 mb-4">Up Next:</h3>
                  <div className="max-h-[30rem] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                    <div className="space-y-4">
                      {videos.map((video) => (
                        <div 
                          key={video._id}
                          onClick={() => setActiveVideo(video)}
                          className={`bg-[#80BCFF] rounded-lg p-4 cursor-pointer hover:shadow-md transition-all flex items-center space-x-4 border-l-4 ${
                            activeVideo?._id === video._id ? 'border-blue-500' : 'border-transparent'
                          }`}
                        >
                          <div className="flex-shrink-0">
                            <div className="w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center">
                              <Play className="w-5 h-5 text-white" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 line-clamp-2">{video.name}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-8">
        <div className="container mx-auto px-2 sm:px-3 lg:px-4 max-w-4xl">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4 text-center">
            Clarity & Confidence
          </h2>
          <p className="text-gray-600 text-center mb-12">
            Your questions, answered clearly and precisely.
          </p>
          
          <div className="space-y-4">
            {faqData.map((faq, index) => (
              <div key={faq._id || faq.id || index} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <button
                  onClick={() => toggleFaq(faq.id)}
                  className="flex justify-between items-center w-full p-6 text-left font-semibold text-gray-900 hover:text-black-600 transition-colors duration-200"
                >
                  <span className="text-lg pr-4">{faq.question}</span>
                  <span className="text-2xl w-8 h-8 flex items-center justify-center rounded-full bg-[#3A6EA5] text-white leading-none flex-shrink-0">
                    {openFaqId === faq.id ? '−' : '+'}
                  </span>
                </button>
                {openFaqId === faq.id && (
                  <div className="px-6 pb-6 text-gray-600 border-t border-gray-100 pt-4 animate-fadeIn">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
      <Footer />
      </div>
    </>
  );
}