import { NextResponse } from 'next/server';
import DBConnection from '../../utils/config/db';
import Booking from '../../utils/models/Booking';
import Test from '../../utils/models/Test';

// AI-powered recommendation engine
export async function POST(request) {
  try {
    await DBConnection();
    
    const { userId, symptoms, age, gender, medicalHistory, previousTests } = await request.json();
    
    // Fetch user's booking history
    const userBookings = await Booking.find({ userId }).sort({ createdAt: -1 }).limit(10);
    const bookedTestNames = userBookings.map(b => b.testName);
    
    // Fetch all available tests
    const allTests = await Test.find({});
    
    // Rule-based recommendation system
    let recommendations = [];
    
    // 1. Symptom-based recommendations
    if (symptoms && symptoms.length > 0) {
      const symptomKeywords = symptoms.join(' ').toLowerCase();
      
      // Heart/Cardiac symptoms
      if (symptomKeywords.match(/chest pain|palpitation|breathless|heart/)) {
        recommendations.push({
          category: 'Cardiac Health',
          tests: ['Lipid Profile', 'ECG', 'Troponin Test', 'D-Dimer'],
          reason: 'Based on cardiac symptoms',
          priority: 'high',
        });
      }
      
      // Diabetes symptoms
      if (symptomKeywords.match(/thirst|urination|hunger|fatigue|sugar/)) {
        recommendations.push({
          category: 'Diabetes Screening',
          tests: ['Blood Sugar Fasting', 'HbA1c', 'Glucose Tolerance Test'],
          reason: 'Based on diabetes symptoms',
          priority: 'high',
        });
      }
      
      // Thyroid symptoms
      if (symptomKeywords.match(/weight|tired|cold|hair loss|thyroid/)) {
        recommendations.push({
          category: 'Thyroid Function',
          tests: ['TSH', 'T3', 'T4', 'Thyroid Profile'],
          reason: 'Based on thyroid symptoms',
          priority: 'medium',
        });
      }
      
      // Liver symptoms
      if (symptomKeywords.match(/jaundice|abdomen|nausea|liver/)) {
        recommendations.push({
          category: 'Liver Function',
          tests: ['Liver Function Test', 'Bilirubin', 'ALT', 'AST'],
          reason: 'Based on liver-related symptoms',
          priority: 'high',
        });
      }
      
      // Kidney symptoms
      if (symptomKeywords.match(/urine|kidney|back pain|swelling/)) {
        recommendations.push({
          category: 'Kidney Function',
          tests: ['Kidney Function Test', 'Creatinine', 'Urea', 'Urine Analysis'],
          reason: 'Based on kidney symptoms',
          priority: 'high',
        });
      }
      
      // Infection symptoms
      if (symptomKeywords.match(/fever|infection|cough|cold/)) {
        recommendations.push({
          category: 'Infection Screening',
          tests: ['Complete Blood Count', 'CRP', 'ESR'],
          reason: 'Based on infection symptoms',
          priority: 'medium',
        });
      }
    }
    
    // 2. Age-based recommendations
    if (age) {
      const ageNum = parseInt(age);
      
      if (ageNum >= 40) {
        recommendations.push({
          category: 'Preventive Health (40+)',
          tests: ['Lipid Profile', 'Blood Sugar', 'Thyroid Profile', 'Vitamin D', 'Vitamin B12'],
          reason: 'Recommended for age 40+',
          priority: 'medium',
        });
      }
      
      if (ageNum >= 50) {
        recommendations.push({
          category: 'Senior Health Checkup',
          tests: ['Bone Density Scan', 'PSA Test', 'Mammography', 'Colonoscopy'],
          reason: 'Recommended for age 50+',
          priority: 'medium',
        });
      }
      
      if (ageNum >= 18 && ageNum <= 35) {
        recommendations.push({
          category: 'Young Adult Screening',
          tests: ['Complete Blood Count', 'Vitamin D', 'Iron Studies'],
          reason: 'Recommended for young adults',
          priority: 'low',
        });
      }
    }
    
    // 3. Gender-specific recommendations
    if (gender === 'female') {
      recommendations.push({
        category: 'Women\'s Health',
        tests: ['Hemoglobin', 'Iron Studies', 'Calcium', 'Vitamin D', 'Thyroid Profile'],
        reason: 'Recommended for women\'s health',
        priority: 'medium',
      });
      
      if (age && parseInt(age) >= 21) {
        recommendations.push({
          category: 'Women\'s Cancer Screening',
          tests: ['Pap Smear', 'Mammography', 'HPV Test'],
          reason: 'Preventive cancer screening for women',
          priority: 'medium',
        });
      }
    }
    
    if (gender === 'male' && age && parseInt(age) >= 40) {
      recommendations.push({
        category: 'Men\'s Health',
        tests: ['PSA Test', 'Testosterone', 'Lipid Profile'],
        reason: 'Recommended for men 40+',
        priority: 'medium',
      });
    }
    
    // 4. Based on previous tests (follow-up recommendations)
    if (bookedTestNames.length > 0) {
      if (bookedTestNames.some(t => t.toLowerCase().includes('diabetes') || t.toLowerCase().includes('sugar'))) {
        recommendations.push({
          category: 'Diabetes Follow-up',
          tests: ['HbA1c', 'Kidney Function Test', 'Lipid Profile'],
          reason: 'Follow-up tests for diabetes monitoring',
          priority: 'high',
        });
      }
      
      if (bookedTestNames.some(t => t.toLowerCase().includes('thyroid'))) {
        recommendations.push({
          category: 'Thyroid Follow-up',
          tests: ['TSH', 'Free T3', 'Free T4'],
          reason: 'Follow-up thyroid monitoring',
          priority: 'medium',
        });
      }
    }
    
    // 5. General wellness package
    if (recommendations.length === 0) {
      recommendations.push({
        category: 'Comprehensive Health Checkup',
        tests: ['Complete Blood Count', 'Lipid Profile', 'Blood Sugar', 'Liver Function Test', 'Kidney Function Test', 'Thyroid Profile'],
        reason: 'Comprehensive annual health screening',
        priority: 'low',
      });
    }
    
    // Find matching tests from database
    const enrichedRecommendations = await Promise.all(
      recommendations.map(async (rec) => {
        const matchingTests = await Test.find({
          testName: { $in: rec.tests.map(t => new RegExp(t, 'i')) }
        }).limit(5);
        
        return {
          ...rec,
          availableTests: matchingTests.map(test => ({
            id: test._id,
            name: test.testName,
            price: test.price || test.avgPrice,
            description: test.description,
            organ: test.organ,
          })),
        };
      })
    );
    
    // Sort by priority
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    enrichedRecommendations.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
    
    return NextResponse.json({
      success: true,
      recommendations: enrichedRecommendations,
      totalCategories: enrichedRecommendations.length,
    });
  } catch (error) {
    console.error('❌ Error generating recommendations:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate recommendations' },
      { status: 500 }
    );
  }
}
