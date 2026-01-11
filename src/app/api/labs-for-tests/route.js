import { NextResponse } from "next/server";
import DBConnection from "../../utils/config/db";
import TestModel from "../../utils/models/Test";
import VendorModel from "../../utils/models/Vendor";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    await DBConnection();
    
    const body = await req.json();
    const { tests } = body;
    
    console.log('Received tests to check:', tests);
    
    if (!tests || !Array.isArray(tests) || tests.length === 0) {
      return NextResponse.json({
        success: false,
        error: "Tests array is required"
      }, { status: 400 });
    }
    
    // Get unique test names from the request
    const testNames = [...new Set(tests)];
    
    console.log('Unique test names:', testNames);
    
    // Find all tests that match these names
    const matchingTests = await TestModel.find({
      testName: { $in: testNames }
    });
    
    console.log('Matching tests found:', matchingTests.map(t => ({ testName: t.testName, availableAtLabs: t.availableAtLabs })));
    
    // Create a map of lab names to the tests they offer
    const labTestMap = new Map();
    
    matchingTests.forEach(test => {
      if (test.availableAtLabs) {
        // Split the comma-separated lab names and add them to the map
        test.availableAtLabs.split(',').forEach(labName => {
          const trimmedName = labName.trim();
          if (trimmedName) {
            if (!labTestMap.has(trimmedName)) {
              labTestMap.set(trimmedName, []);
            }
            labTestMap.get(trimmedName).push(test.testName);
          }
        });
      }
    });
    
    console.log('Lab test map:', labTestMap);
    
    // Convert map to array of objects with lab info and test details
    const labNamesArray = Array.from(labTestMap.keys());
    
    console.log('Lab names array:', labNamesArray);
    
    if (labNamesArray.length === 0) {
      return NextResponse.json({
        success: true,
        labs: []
      });
    }
    
    // Find all vendors (labs) whose labName matches any of the lab names
    const vendors = await VendorModel.find({
      labName: { $in: labNamesArray }
    });
    
    console.log('Vendors found:', vendors.map(v => v.labName));
    
    // Transform vendors to match the expected structure with test availability info
    const labLocations = vendors.map(vendor => {
      const labName = vendor.labName || 'Unknown Lab';
      const testsAtLab = labTestMap.get(labName) || [];
      
      console.log(`Tests at lab ${labName}:`, testsAtLab);
      
      // Determine if this lab has ALL the requested tests
      const hasAllTests = testNames.every(testName => testsAtLab.includes(testName));
      const availableTestCount = testsAtLab.length;
      
      console.log(`Lab ${labName} has all tests:`, hasAllTests);
      
      return {
        name: labName,
        details: vendor.description || 'No description available',
        address: vendor.address || 'Address not available',
        phone: vendor.phone || 'Phone not available',
        testsAvailable: testsAtLab,
        hasAllTests: hasAllTests,
        availableTestCount: availableTestCount,
        totalTestsRequested: testNames.length
      };
    });
    
    // Sort labs: those with all tests first, then by number of available tests
    labLocations.sort((a, b) => {
      // Primary sort: labs with all tests first
      if (a.hasAllTests && !b.hasAllTests) return -1;
      if (!a.hasAllTests && b.hasAllTests) return 1;
      
      // Secondary sort: by number of available tests (descending)
      return b.availableTestCount - a.availableTestCount;
    });
    
    console.log('Final lab locations:', labLocations);
    
    return NextResponse.json({
      success: true,
      labs: labLocations
    });
  } catch (error) {
    console.error("Error fetching labs for tests:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to fetch labs for tests",
      message: error.message
    }, { status: 500 });
  }
}