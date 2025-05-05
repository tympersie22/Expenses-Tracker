import { NextResponse } from 'next/server';
import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';

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

export async function POST(request: Request) {
  try {
    console.log('Exchange token API called');
    const body = await request.json();
    const { public_token } = body;

    console.log('Public token received:', public_token ? 'Yes (token hidden)' : 'No');

    if (!public_token) {
      console.error('No public token provided');
      return NextResponse.json(
        { error: 'Public token is required' },
        { status: 400 }
      );
    }

    console.log('Exchanging public token for access token...');
    
    // Exchange the public token for an access token
    const exchangeResponse = await plaidClient.itemPublicTokenExchange({
      public_token,
    });
    
    const accessToken = exchangeResponse.data.access_token;
    const itemId = exchangeResponse.data.item_id;
    
    console.log('Access token obtained successfully');
    console.log('Item ID:', itemId);
    
    // Get account information
    console.log('Fetching account information...');
    const accountsResponse = await plaidClient.accountsGet({
      access_token: accessToken,
    });
    
    const accounts = accountsResponse.data.accounts;
    console.log(`Retrieved ${accounts.length} accounts`);
    
    // Log account details (without sensitive information)
    accounts.forEach((account, index) => {
      console.log(`Account ${index + 1}: ${account.name} (${account.type}) - Balance: ${account.balances.current}`);
    });
    
    // Store the access token and item ID in your database
    // For demo purposes, we'll just return the accounts data
    // In a real app, you would store this in your database
    
    return NextResponse.json({
      access_token: accessToken,
      item_id: itemId,
      accounts: accounts,
    });
  } catch (error) {
    console.error('Error exchanging token:', error);
    
    // Provide more detailed error information
    let errorMessage = 'Failed to exchange token';
    let errorDetails = '';
    
    if (error instanceof Error) {
      errorMessage = error.message;
      errorDetails = error.stack || '';
      console.error('Error details:', errorMessage);
      console.error('Error stack:', errorDetails);
    } else {
      errorDetails = String(error);
      console.error('Unknown error type:', errorDetails);
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