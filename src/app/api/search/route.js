import { NextResponse } from "next/server";
import DBConnection from "../../utils/config/db";
import TestModel from "../../utils/models/Test";
import VendorModel from "../../utils/models/Vendor";

export const runtime = "nodejs";

export async function GET(req) {
  try {
    await DBConnection();
    
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';
    const type = searchParams.get('type') || 'all'; // all, tests, labs
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    
    if (!query) {
      return NextResponse.json({
        success: true,
        results: [],
        totalCount: 0,
        currentPage: page,
        totalPages: 0
      });
    }
    
    const skip = (page - 1) * limit;
    
    let testResults = [];
    let labResults = [];
    let totalCount = 0;
    
    // Search tests
    if (type === 'all' || type === 'tests') {
      const testQuery = {
        $or: [
          { testName: { $regex: query, $options: 'i' } },
          { organ: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } },
          { category: { $regex: query, $options: 'i' } }
        ]
      };
      
      const testCount = await TestModel.countDocuments(testQuery);
      testResults = await TestModel.find(testQuery)
        .skip(skip)
        .limit(limit)
        .sort({ testName: 1 })
        .lean();
      
      // Enrich test results with vendor info
      const enrichedTestResults = await Promise.all(testResults.map(async (test) => {
        let vendor = null;
        if (test.vendorId) {
          vendor = await VendorModel.findById(test.vendorId).select('labName').lean();
        }
        return {
          ...test,
          type: 'test',
          vendorName: vendor ? vendor.labName : 'Unknown Lab'
        };
      }));
      
      testResults = enrichedTestResults;
      totalCount += testCount;
    }
    
    // Search labs
    if (type === 'all' || type === 'labs') {
      const labQuery = {
        $or: [
          { labName: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } },
          { address: { $regex: query, $options: 'i' } }
        ]
      };
      
      const labCount = await VendorModel.countDocuments(labQuery);
      labResults = await VendorModel.find(labQuery)
        .skip(skip)
        .limit(limit)
        .sort({ labName: 1 })
        .lean();
      
      // Add type to lab results
      labResults = labResults.map(lab => ({
        ...lab,
        type: 'lab'
      }));
      
      totalCount += labCount;
    }
    
    // Combine results
    const allResults = [...testResults, ...labResults];
    
    // If we're doing combined search, we need to adjust pagination
    const totalPages = Math.ceil(totalCount / limit);
    
    return NextResponse.json({
      success: true,
      results: allResults.slice(0, limit),
      totalCount,
      currentPage: page,
      totalPages
    });
  } catch (error) {
    console.error("Error performing search:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to perform search",
      message: error.message
    }, { status: 500 });
  }
}