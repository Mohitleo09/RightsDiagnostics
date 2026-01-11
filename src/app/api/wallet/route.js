import { NextResponse } from 'next/server';
import DBConnection from '../../utils/config/db';
import UserModel from '../../utils/models/User';
import Transaction from '../../utils/models/Transaction';

export const runtime = "nodejs";

// GET - Fetch user wallet balance and transactions
export async function GET(request) {
  try {
    await DBConnection();
    
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');
    const email = searchParams.get('email');
    
    if (!phone && !email) {
      return NextResponse.json({
        success: false,
        error: "Phone or email is required"
      }, { status: 400 });
    }
    
    // Prioritize phone for query (since OTP users login with phone)
    const query = phone ? { phone } : { email };
    
    const user = await UserModel.findOne(query);
    
    if (!user) {
      return NextResponse.json({
        success: false,
        error: "User not found"
      }, { status: 404 });
    }
    
    // Fetch recent transactions for this user
    const transactions = await Transaction.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .limit(10);
    
    return NextResponse.json({
      success: true,
      walletBalance: user.walletBalance || 0,
      transactions: transactions.map(transaction => ({
        id: transaction._id,
        type: transaction.type,
        amount: transaction.amount,
        description: transaction.description,
        balanceAfter: transaction.balanceAfter,
        referenceId: transaction.referenceId,
        status: transaction.status,
        createdAt: transaction.createdAt,
      })),
      user: {
        id: user._id.toString(),
        name: user.name || user.username,
        email: user.email,
        phone: user.phone
      }
    });
    
  } catch (error) {
    console.error("Error fetching wallet data:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to fetch wallet data",
      message: error.message
    }, { status: 500 });
  }
}

// POST - Add money to wallet
export async function POST(request) {
  try {
    await DBConnection();
    
    const { phone, email, amount } = await request.json();
    
    if (!phone && !email) {
      return NextResponse.json({
        success: false,
        error: "Phone or email is required"
      }, { status: 400 });
    }
    
    if (!amount || amount <= 0) {
      return NextResponse.json({
        success: false,
        error: "Valid amount is required"
      }, { status: 400 });
    }
    
    // Prioritize phone for query (since OTP users login with phone)
    const query = phone ? { phone } : { email };
    
    const user = await UserModel.findOne(query);
    
    if (!user) {
      return NextResponse.json({
        success: false,
        error: "User not found"
      }, { status: 404 });
    }
    
    // Update wallet balance
    const newBalance = (user.walletBalance || 0) + amount;
    
    const updatedUser = await UserModel.findOneAndUpdate(
      query,
      { walletBalance: newBalance },
      { new: true }
    );
    
    // Create transaction record
    const transaction = await Transaction.create({
      userId: user._id,
      type: 'credit',
      amount: amount,
      description: 'Wallet Recharge',
      balanceAfter: newBalance,
      status: 'completed'
    });
    
    return NextResponse.json({
      success: true,
      message: "Wallet updated successfully",
      walletBalance: updatedUser.walletBalance,
      addedAmount: amount,
      transaction: {
        id: transaction._id,
        type: transaction.type,
        amount: transaction.amount,
        description: transaction.description,
        balanceAfter: transaction.balanceAfter,
        createdAt: transaction.createdAt,
      }
    });
    
  } catch (error) {
    console.error("Error updating wallet:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to update wallet",
      message: error.message
    }, { status: 500 });
  }
}

// PUT - Deduct money from wallet (for payments)
export async function PUT(request) {
  try {
    await DBConnection();
    
    const { phone, email, amount, description, referenceId } = await request.json();
    
    if (!phone && !email) {
      return NextResponse.json({
        success: false,
        error: "Phone or email is required"
      }, { status: 400 });
    }
    
    if (!amount || amount <= 0) {
      return NextResponse.json({
        success: false,
        error: "Valid amount is required"
      }, { status: 400 });
    }
    
    // Prioritize phone for query (since OTP users login with phone)
    const query = phone ? { phone } : { email };
    
    const user = await UserModel.findOne(query);
    
    if (!user) {
      return NextResponse.json({
        success: false,
        error: "User not found"
      }, { status: 404 });
    }
    
    // Check if user has sufficient balance
    const currentBalance = user.walletBalance || 0;
    if (currentBalance < amount) {
      return NextResponse.json({
        success: false,
        error: "Insufficient wallet balance"
      }, { status: 400 });
    }
    
    // Deduct amount from wallet balance
    const newBalance = currentBalance - amount;
    
    const updatedUser = await UserModel.findOneAndUpdate(
      query,
      { walletBalance: newBalance },
      { new: true }
    );
    
    // Create transaction record
    const transaction = await Transaction.create({
      userId: user._id,
      type: 'debit',
      amount: amount,
      description: description || 'Payment',
      balanceAfter: newBalance,
      referenceId: referenceId,
      status: 'completed'
    });
    
    return NextResponse.json({
      success: true,
      message: "Payment successful",
      walletBalance: updatedUser.walletBalance,
      deductedAmount: amount,
      transaction: {
        id: transaction._id,
        type: transaction.type,
        amount: transaction.amount,
        description: transaction.description,
        balanceAfter: transaction.balanceAfter,
        referenceId: transaction.referenceId,
        createdAt: transaction.createdAt,
      }
    });
    
  } catch (error) {
    console.error("Error processing payment:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to process payment",
      message: error.message
    }, { status: 500 });
  }
}