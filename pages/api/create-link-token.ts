import { NextApiRequest, NextApiResponse } from 'next';
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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check if required environment variables are set
    if (!process.env.PLAID_CLIENT_ID || !process.env.PLAID_SECRET) {
      return res.status(500).json({ error: 'Missing required Plaid environment variables' });
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
    
    const createTokenResponse = await plaidClient.linkTokenCreate(request);
    console.log('Link token created successfully');
    
    return res.status(200).json({
      link_token: createTokenResponse.data.link_token,
    });
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
    
    return res.status(500).json({ 
      error: errorMessage, 
      details: errorDetails,
      message: 'Please check your Plaid credentials and try again'
    });
  }
} 