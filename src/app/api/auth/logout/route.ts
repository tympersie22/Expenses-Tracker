import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST() {
  try {
    const token = cookies().get('token')?.value;
    
    if (token) {
      // Delete session from database
      await prisma.session.deleteMany({
        where: { token },
      });

      // Clear cookie
      cookies().delete('token');
    }

    return NextResponse.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 