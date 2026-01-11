'use client';

import { useState, useEffect } from 'react';
import Script from 'next/script';

const RazorpayPayment = ({ amount, bookingId, userId, onSuccess, onFailure }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  const handlePayment = async () => {
    if (!razorpayLoaded) {
      alert('Payment gateway is loading. Please wait...');
      return;
    }

    setIsProcessing(true);

    try {
      // Create order
      const orderResponse = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          receipt: `booking_${bookingId}`,
          notes: {
            bookingId,
            userId,
          },
        }),
      });

      const orderData = await orderResponse.json();

      if (!orderData.success) {
        throw new Error(orderData.error || 'Failed to create order');
      }

      // Initialize Razorpay
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: 'RightsLab',
        description: 'Lab Test Booking Payment',
        order_id: orderData.order.id,
        handler: async function (response) {
          try {
            // Verify payment
            const verifyResponse = await fetch('/api/payment/verify', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                bookingId,
                userId,
                amount: orderData.order.amount,
              }),
            });

            const verifyData = await verifyResponse.json();

            if (verifyData.success) {
              if (onSuccess) onSuccess(verifyData.payment);
            } else {
              throw new Error(verifyData.error || 'Payment verification failed');
            }
          } catch (error) {
            console.error('Payment verification error:', error);
            if (onFailure) onFailure(error.message);
          } finally {
            setIsProcessing(false);
          }
        },
        prefill: {
          name: localStorage.getItem('userName') || '',
          email: localStorage.getItem('userEmail') || '',
          contact: localStorage.getItem('userPhone') || '',
        },
        theme: {
          color: '#F97316',
        },
        modal: {
          ondismiss: function () {
            setIsProcessing(false);
            if (onFailure) onFailure('Payment cancelled by user');
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error('Payment error:', error);
      setIsProcessing(false);
      if (onFailure) onFailure(error.message);
    }
  };

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        onLoad={() => setRazorpayLoaded(true)}
        onError={() => console.error('Razorpay SDK failed to load')}
      />
      <button
        onClick={handlePayment}
        disabled={isProcessing || !razorpayLoaded}
        className="w-full bg-[#007AFF] hover:bg-[#0052FF] disabled:bg-[#00A3FF] text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center"
      >
        {isProcessing ? (
          <>
            <svg
              className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Processing...
          </>
        ) : (
          <>
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            Pay ₹{amount}
          </>
        )}
      </button>
    </>
  );
};

export default RazorpayPayment;
