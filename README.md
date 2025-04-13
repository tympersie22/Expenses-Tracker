# Expenses Tracker

A modern expense tracking application built with Next.js, React, and Plaid integration.

## Features

- Track income and expenses
- Connect bank accounts via Plaid
- View transaction history
- Analyze spending patterns with charts
- Manage multiple accounts and wallets

## Getting Started

### Prerequisites

- Node.js 16.x or later
- npm or yarn
- Plaid account (for bank integration)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/expenses-tracker.git
cd expenses-tracker
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
   - Copy `.env.local.example` to `.env.local`
   - Add your Plaid credentials from the [Plaid Dashboard](https://dashboard.plaid.com/team/keys)

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Plaid Integration

This application uses Plaid to connect bank accounts. To set up Plaid:

1. Create a [Plaid account](https://dashboard.plaid.com/signup)
2. Get your API credentials from the [Plaid Dashboard](https://dashboard.plaid.com/team/keys)
3. Add your credentials to the `.env.local` file:
   ```
   PLAID_CLIENT_ID=your_client_id_here
   PLAID_SECRET=your_secret_here
   PLAID_ENV=sandbox
   ```

## Project Structure

- `src/app`: Next.js app router pages
- `src/components`: React components
- `src/lib`: Utility functions and shared code

## Technologies Used

- Next.js 12.3.4
- React 18
- TypeScript
- Tailwind CSS
- Chart.js
- Plaid API
- date-fns

## License

MIT 