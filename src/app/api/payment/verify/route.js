import { NextResponse } from 'next/server';
import crypto from 'crypto';
import DBConnection from '../../../utils/config/db';
import Payment from '../../../utils/models/Payment';

export async function POST(request) {
  try {
    await DBConnection();
    
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      bookingId,
      userId,
      amount,
    } = await request.json();

    // Verify signature
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      return NextResponse.json(
        { success: false, error: 'Invalid payment signature' },
        { status: 400 }
      );
    }

    // Save payment record
    const payment = await Payment.create({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
      bookingId,
      userId,
      amount: amount / 100, // Convert paise to rupees
      status: 'success',
      paymentMethod: 'razorpay',
      createdAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: 'Payment verified successfully',
      payment: {
        id: payment._id,
        orderId: payment.orderId,
        paymentId: payment.paymentId,
        amount: payment.amount,
        status: payment.status,
      },
    });
  } catch (error) {
    console.error('❌ Error verifying payment:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to verify payment',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
