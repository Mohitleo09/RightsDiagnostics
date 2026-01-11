'use client';

import { useState } from 'react';
import { Star, X } from 'lucide-react';

const ReviewModal = ({ booking, onClose, onSubmitSuccess }) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [review, setReview] = useState('');
  const [serviceQuality, setServiceQuality] = useState(0);
  const [staffBehavior, setStaffBehavior] = useState(0);
  const [cleanliness, setCleanliness] = useState(0);
  const [timeTaken, setTimeTaken] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const renderStars = (value, setValue, hoverValue, setHoverValue) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-6 h-6 cursor-pointer transition-colors ${
              star <= (hoverValue || value)
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            }`}
            onMouseEnter={() => setHoverValue(star)}
            onMouseLeave={() => setHoverValue(0)}
            onClick={() => setValue(star)}
          />
        ))}
      </div>
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (rating === 0) {
      alert('Please select a rating');
      return;
    }

    if (review.trim().length < 10) {
      alert('Please write a review with at least 10 characters');
      return;
    }

    setIsSubmitting(true);

    try {
      const userId = localStorage.getItem('userId');
      const userName = localStorage.getItem('userName');

      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          labName: booking.labName || booking.location,
          bookingId: booking.bookingId || booking.id,
          userId,
          userName,
          rating,
          review: review.trim(),
          serviceQuality,
          staffBehavior,
          cleanliness,
          timeTaken,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert('Review submitted successfully! It will be published after admin approval.');
        if (onSubmitSuccess) onSubmitSuccess();
        onClose();
      } else {
        alert(data.error || 'Failed to submit review');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Failed to submit review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Write a Review</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Booking for</p>
            <p className="font-semibold text-gray-900">{booking.testName}</p>
            <p className="text-sm text-gray-600">{booking.labName || booking.location}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Overall Rating */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Overall Rating *
              </label>
              {renderStars(rating, setRating, hoverRating, setHoverRating)}
            </div>

            {/* Detailed Ratings */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Service Quality
                </label>
                {renderStars(serviceQuality, setServiceQuality, 0, () => {})}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Staff Behavior
                </label>
                {renderStars(staffBehavior, setStaffBehavior, 0, () => {})}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cleanliness
                </label>
                {renderStars(cleanliness, setCleanliness, 0, () => {})}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time Taken
                </label>
                {renderStars(timeTaken, setTimeTaken, 0, () => {})}
              </div>
            </div>

            {/* Review Text */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Review *
              </label>
              <textarea
                value={review}
                onChange={(e) => setReview(e.target.value)}
                rows={5}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007AFF] focus:border-[#007AFF]"
                placeholder="Share your experience with this lab..."
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Minimum 10 characters ({review.length}/10)
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-6 py-3 bg-[#007AFF] hover:bg-[#0052FF] disabled:bg-[#00A3FF] text-white font-semibold rounded-lg transition-colors"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ReviewModal;
