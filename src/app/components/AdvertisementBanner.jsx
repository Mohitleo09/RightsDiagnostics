'use client';

import React, { useState, useEffect } from 'react';

const AdvertisementBanner = ({ contentType = 'Home Page', className = '' }) => {
  const [advertisement, setAdvertisement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAdvertisement = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`/api/advertisements?contentType=${encodeURIComponent(contentType)}&status=Active`);
        const result = await response.json();
        
        if (result.success && result.data.length > 0) {
          // Get a random advertisement from the list
          const randomIndex = Math.floor(Math.random() * result.data.length);
          setAdvertisement(result.data[randomIndex]);
        } else {
          setError('No advertisements available');
        }
      } catch (error) {
        console.error('Error fetching advertisement:', error);
        setError('Failed to load advertisement');
      } finally {
        setLoading(false);
      }
    };

    fetchAdvertisement();
  }, [contentType]);

  if (loading) {
    return (
      <div className={`bg-gray-200 border-2 border-dashed rounded-xl w-full h-32 flex items-center text-center ${className}`}>
        <span className="text-gray-500">Loading advertisements...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white-100 border-2 border border-grey-100 rounded-xl w-full h-32 flex items-center text-center ${className}`}>
        <span className="text-black">{error}</span>
      </div>
    );
  }

  if (!advertisement) {
    return (
      <div className={`bg-white-100 border-2 border border-gray-100 rounded-xl w-full h-32 flex items-center text-center ${className}`}>
        <span className="text-black">No advertisements available</span>
      </div>
    );
  }

  return (
    <div className={`rounded-xl overflow-hidden ${className}`}>
      <img 
        src={advertisement.image} 
        alt={advertisement.name} 
        className="w-full h-full object-cover"
        onError={(e) => {
          console.error('Error loading advertisement image:', advertisement.image);
          e.target.style.display = 'none';
        }}
      />
    </div>
  );
};

export default AdvertisementBanner;