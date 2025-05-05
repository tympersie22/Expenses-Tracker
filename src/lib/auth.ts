import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { RequestCookies } from 'next/dist/server/web/spec-extension/cookies';

const prisma = new PrismaClient();
const secretKey = process.env.JWT_SECRET_KEY;
const key = new TextEncoder().encode(secretKey);

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  console.log('Verifying password...');
  console.log('Hash from database:', hash);
  const result = await bcrypt.compare(password, hash);
  console.log('Password verification result:', result);
  return result;
}

export async function encrypt(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(key);
}

export async function decrypt(input: string): Promise<any> {
  const { payload } = await jwtVerify(input, key, {
    algorithms: ['HS256'],
  });
  return payload;
}

export async function createSession(userId: string) {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const token = await encrypt({ userId, expiresAt });

  const response = NextResponse.json({ success: true });
  response.cookies.set('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: expiresAt,
    path: '/',
  });
  return response;
}

export async function verifyToken(token: string) {
  try {
    const payload = await decrypt(token);
    if (!payload.userId || !payload.expiresAt) {
      throw new Error('Invalid token');
    }
    if (new Date(payload.expiresAt) < new Date()) {
      throw new Error('Token expired');
    }
    return payload;
  } catch (error) {
    throw new Error('Invalid token');
  }
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return null;
  return await verifyToken(token);
}

export async function logout() {
  const response = NextResponse.next();
  response.cookies.delete('token');
  return response;
}

export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      emailVerified: true,
      twoFactorEnabled: true,
      failedAttempts: true,
      lastFailedAttempt: true,
      lockedUntil: true,
    },
  });

  if (!user) return null;

  return user;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Not authenticated');
  }
  return user;
}

export async function handleFailedLogin(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      failedAttempts: true,
      lastFailedAttempt: true,
    },
  });

  if (!user) return;

  const now = new Date();
  const lastFailedAttempt = user.lastFailedAttempt || now;
  const timeSinceLastAttempt = now.getTime() - lastFailedAttempt.getTime();

  // Reset failed attempts if more than 15 minutes have passed
  if (timeSinceLastAttempt > 15 * 60 * 1000) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        failedAttempts: 1,
        lastFailedAttempt: now,
      },
    });
    return;
  }

  const newFailedAttempts = (user.failedAttempts || 0) + 1;

  // Lock account after 3 failed attempts
  if (newFailedAttempts >= 3) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        failedAttempts: newFailedAttempts,
        lastFailedAttempt: now,
        lockedUntil: new Date(now.getTime() + 15 * 60 * 1000), // Lock for 15 minutes
      },
    });
  } else {
    await prisma.user.update({
      where: { id: userId },
      data: {
        failedAttempts: newFailedAttempts,
        lastFailedAttempt: now,
      },
    });
  }
}

export async function resetFailedAttempts(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: {
      failedAttempts: 0,
      lastFailedAttempt: null,
      lockedUntil: null,
    },
  });
} 