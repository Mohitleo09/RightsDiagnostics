import { updateTestPrices } from '../../utils/updateTestPrices';

export async function GET() {
  try {
    const result = await updateTestPrices();
    
    if (result.success) {
      return new Response(
        JSON.stringify({
          success: true,
          message: `Successfully updated ${result.updatedCount} tests with proper actualPrice values`,
          updatedCount: result.updatedCount
        }),
        { 
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    } else {
      return new Response(
        JSON.stringify({
          success: false,
          error: result.error
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  } catch (error) {
    console.error('Error in update-test-prices API:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}