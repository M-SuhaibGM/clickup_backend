// src/types/index.ts
export interface RegisterUser {
  email: string;
  password: string;
  name: string;
}

export interface LoginUser {
  email: string;
  password: string;
}

export interface VerifyOTP {
  email: string;
  otp: string;
}

export interface DecodedToken {
  id: number;
  email: string;
  name: string;
  role: string;
  iat: number;
  exp: number;
}