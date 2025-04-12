import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { amount, description, category } = body;

    // For demo purposes, we'll use a hardcoded user ID
    // In a real app, this would come from the authenticated user's session
    const userId = '1';
    const accountId = '1';

    const expense = await prisma.expense.create({
      data: {
        amount: parseFloat(amount),
        description,
        category,
        userId,
        accountId,
      },
    });

    return NextResponse.json(expense);
  } catch (error) {
    console.error('Failed to create expense:', error);
    return NextResponse.json(
      { error: 'Failed to create expense' },
      { status: 500 }
    );
  }
} 