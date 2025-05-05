import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyPassword, createSession, handleFailedLogin, resetFailedAttempts } from '@/lib/auth';
import { z } from 'zod';
import { cookies } from 'next/headers';

const prisma = new PrismaClient();

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('Login attempt for email:', body.email);
    const validatedData = loginSchema.parse(body);

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email },
      select: {
        id: true,
        email: true,
        password: true,
        firstName: true,
        lastName: true,
        emailVerified: true,
        twoFactorEnabled: true,
        lockedUntil: true,
      },
    });

    if (!user) {
      console.log('User not found:', validatedData.email);
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    console.log('User found:', user.email);

    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const minutesLeft = Math.ceil((user.lockedUntil.getTime() - Date.now()) / (1000 * 60));
      console.log('Account locked for', minutesLeft, 'minutes');
      return NextResponse.json(
        { error: `Account is locked. Please try again in ${minutesLeft} minutes.` },
        { status: 423 }
      );
    }

    // Verify password
    const isValidPassword = await verifyPassword(validatedData.password, user.password);
    console.log('Password verification result:', isValidPassword);
    
    if (!isValidPassword) {
      await handleFailedLogin(user.id);
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Reset failed attempts on successful login
    await resetFailedAttempts(user.id);

    // Create session and get response with cookie
    const response = await createSession(user.id);
    console.log('Session created successfully');

    // Add user data to the response
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        emailVerified: user.emailVerified,
        twoFactorEnabled: user.twoFactorEnabled,
      },
    }, { headers: response.headers });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 