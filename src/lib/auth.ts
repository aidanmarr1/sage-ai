import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { db } from "./db";
import { nanoid } from "nanoid";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback-secret-change-me"
);

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface JWTPayload {
  userId: string;
  email: string;
}

// Password hashing
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// JWT functions
export async function createToken(payload: JWTPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

// Session management
export async function setSession(token: string) {
  const cookieStore = await cookies();
  cookieStore.set("auth-token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });
}

export async function getSession(): Promise<User | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;

  if (!token) return null;

  const payload = await verifyToken(token);
  if (!payload) return null;

  // Fetch user from database
  const result = await db.execute({
    sql: "SELECT id, email, name, created_at as createdAt FROM users WHERE id = ?",
    args: [payload.userId],
  });

  if (result.rows.length === 0) return null;

  const row = result.rows[0];
  return {
    id: row.id as string,
    email: row.email as string,
    name: row.name as string,
    createdAt: row.createdAt as string,
  };
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete("auth-token");
}

// User operations
export async function createUser(
  email: string,
  password: string,
  name: string
): Promise<User> {
  const id = nanoid();
  const passwordHash = await hashPassword(password);

  await db.execute({
    sql: "INSERT INTO users (id, email, password_hash, name) VALUES (?, ?, ?, ?)",
    args: [id, email, passwordHash, name],
  });

  return { id, email, name, createdAt: new Date().toISOString() };
}

export async function getUserByEmail(email: string) {
  const result = await db.execute({
    sql: "SELECT id, email, password_hash, name, created_at as createdAt FROM users WHERE email = ?",
    args: [email],
  });

  if (result.rows.length === 0) return null;

  const row = result.rows[0];
  return {
    id: row.id as string,
    email: row.email as string,
    passwordHash: row.password_hash as string,
    name: row.name as string,
    createdAt: row.createdAt as string,
  };
}
