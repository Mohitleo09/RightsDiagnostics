import mongoose from 'mongoose';
import TestModel from './models/Test.js';
import VendorModel from './models/Vendor.js';
import DBConnection from './config/db.js';

/**
 * Utility function to update existing tests with proper actualPrice values
 * This ensures that each test has vendor-specific pricing set up correctly
 */
export async function updateTestPrices() {
  try {
    await DBConnection();
    
    // Fetch all tests
    const tests = await TestModel.find({});
    console.log(`Found ${tests.length} tests to update`);
    
    let updatedCount = 0;
    
    for (const test of tests) {
      // Check if actualPrice is already properly set up as an object
      if (typeof test.actualPrice === 'object' && test.actualPrice !== null) {
        // Check if it has any vendor-specific prices
        const keys = Object.keys(test.actualPrice);
        if (keys.length > 0) {
          console.log(`Test ${test.testName} already has proper actualPrice setup`);
          continue;
        }
      }
      
      // If actualPrice is not set up properly, we need to initialize it
      try {
        // Get the vendor for this test
        const vendor = await VendorModel.findById(test.vendorId);
        if (!vendor) {
          console.warn(`Could not find vendor ${test.vendorId} for test ${test.testName}`);
          continue;
        }
        
        // Use the vendor's labName as the key for actualPrice
        const vendorLabName = vendor.labName || vendor.name || test.vendorId;
        
        // Set up actualPrice as an object with the vendor's lab name as key
        // Use the test's price as the default actual price for this vendor
        const actualPriceObject = {
          [vendorLabName]: test.actualPrice || test.price || ''
        };
        
        // Update the test
        await TestModel.findByIdAndUpdate(test._id, {
          actualPrice: actualPriceObject
        });
        
        console.log(`Updated test ${test.testName} with actualPrice for vendor ${vendorLabName}`);
        updatedCount++;
      } catch (error) {
        console.error(`Error updating test ${test.testName}:`, error.message);
      }
    }
    
    console.log(`Successfully updated ${updatedCount} tests with proper actualPrice values`);
    return { success: true, updatedCount };
  } catch (error) {
    console.error('Error updating test prices:', error);
    return { success: false, error: error.message };
  }
}

// Run the function if this file is executed directly
if (process.argv[1] && process.argv[1].endsWith('updateTestPrices.js')) {
  updateTestPrices().then(result => {
    console.log('Update result:', result);
    process.exit(0);
  }).catch(error => {
    console.error('Update failed:', error);
    process.exit(1);
  });
}