import { NextResponse } from 'next/server';
import { Configuration, PlaidApi, PlaidEnvironments, CountryCode, Products } from 'plaid';

// Log environment variables (without exposing secrets)
console.log('PLAID_ENV:', process.env.PLAID_ENV || 'sandbox');
console.log('PLAID_CLIENT_ID exists:', !!process.env.PLAID_CLIENT_ID);
console.log('PLAID_SECRET exists:', !!process.env.PLAID_SECRET);

// Check if required environment variables are set
if (!process.env.PLAID_CLIENT_ID || !process.env.PLAID_SECRET) {
  console.error('Missing required Plaid environment variables');
}

const configuration = new Configuration({
  basePath: PlaidEnvironments[process.env.PLAID_ENV || 'sandbox'],
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID || '',
      'PLAID-SECRET': process.env.PLAID_SECRET || '',
    },
  },
});

const plaidClient = new PlaidApi(configuration);

export async function POST() {
  try {
    // Check if required environment variables are set
    if (!process.env.PLAID_CLIENT_ID || !process.env.PLAID_SECRET) {
      return NextResponse.json(
        { error: 'Missing required Plaid environment variables' },
        { status: 500 }
      );
    }

    console.log('Creating link token...');
    
    const request = {
      user: { client_user_id: 'unique-user-id' },
      client_name: 'Expense Tracker',
      products: ['auth', 'transactions'] as Products[],
      country_codes: ['US' as CountryCode],
      language: 'en',
    };

    console.log('Request:', JSON.stringify(request, null, 2));
    
    try {
      const createTokenResponse = await plaidClient.linkTokenCreate(request);
      console.log('Link token created successfully');
      
      return NextResponse.json({
        link_token: createTokenResponse.data.link_token,
      });
    } catch (plaidError: any) {
      console.error('Plaid API error:', plaidError);
      
      // Extract error details from Plaid error
      let errorMessage = 'Failed to create link token';
      let errorDetails = '';
      
      if (plaidError instanceof Error) {
        errorMessage = plaidError.message;
        errorDetails = plaidError.stack || '';
      } else if (plaidError.response && plaidError.response.data) {
        // Handle Axios error with Plaid response
        errorMessage = plaidError.response.data.error_message || 'Plaid API error';
        errorDetails = JSON.stringify(plaidError.response.data);
      } else {
        errorDetails = String(plaidError);
      }
      
      return NextResponse.json(
        { 
          error: errorMessage, 
          details: errorDetails,
          message: 'Please check your Plaid credentials and try again'
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error creating link token:', error);
    
    // Provide more detailed error information
    let errorMessage = 'Failed to create link token';
    let errorDetails = '';
    
    if (error instanceof Error) {
      errorMessage = error.message;
      errorDetails = error.stack || '';
    } else {
      errorDetails = String(error);
    }
    
    return NextResponse.json(
      { 
        error: errorMessage, 
        details: errorDetails,
        message: 'Please check your Plaid credentials and try again'
      },
      { status: 500 }
    );
  }
} 