import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { amount, description, category } = body;
    const parsedAmount = Number.parseFloat(String(amount));

    if (!description || !category || Number.isNaN(parsedAmount)) {
      return NextResponse.json(
        { error: 'Invalid payload. Expected amount, description, and category.' },
        { status: 400 }
      );
    }

    // Temporary response while CSV-first transaction storage is used.
    return NextResponse.json(
      {
        message: 'Expense endpoint is not connected to a Prisma Expense model yet.',
        expense: {
          id: `temp-${Date.now()}`,
          amount: parsedAmount,
          description: String(description),
          category: String(category),
          createdAt: new Date().toISOString(),
        },
      },
      { status: 202 }
    );
  } catch (error) {
    console.error('Failed to create expense:', error);
    return NextResponse.json(
      { error: 'Failed to create expense' },
      { status: 500 }
    );
  }
} 
