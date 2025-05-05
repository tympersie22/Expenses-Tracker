import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { hashPassword } from '@/lib/auth';

const prisma = new PrismaClient();

export async function POST() {
  try {
    // Create test user
    const testUser = await prisma.user.create({
      data: {
        email: 'test@example.com',
        password: await hashPassword('Test123!'),
        firstName: 'Test',
        lastName: 'User',
      },
    });

    return NextResponse.json({
      message: 'Test user created successfully',
      user: {
        id: testUser.id,
        email: testUser.email,
      },
    });
  } catch (error) {
    console.error('Test setup error:', error);
    return NextResponse.json(
      { error: 'Failed to create test user' },
      { status: 500 }
    );
  }
} 