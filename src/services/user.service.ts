import bcrypt from 'bcryptjs';
import { UserModel } from '../models/user.model';

export const UserService = {
  async getSafeUser(id: string) {
    const user = await UserModel.findById(id);
    if (!user) return null;
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      provider: user.provider,
      createdAt: user.createdAt,
    };
  },
  async updateProfile(id: string, input: { name?: string; email?: string; password?: string; avatar?: string | null }) {
    const data: { name?: string; email?: string; password?: string; avatar?: string | null } = {};
    if (input.avatar !== undefined) {
      if (input.avatar !== null && !/^https:\/\/\S+$/.test(input.avatar)) throw Object.assign(new Error('Invalid avatar URL'), { status: 400 });
      data.avatar = input.avatar;
    }
    if (input.name !== undefined) {
      const name = input.name.trim();
      if (!name) throw Object.assign(new Error('Name cannot be empty'), { status: 400 });
      data.name = name;
    }
    if (input.email !== undefined) {
      const email = input.email.trim().toLowerCase();
      if (!/^\S+@\S+\.\S+$/.test(email)) throw Object.assign(new Error('Invalid email'), { status: 400 });
      const existing = await UserModel.findByEmail(email);
      if (existing && existing.id !== id) throw Object.assign(new Error('Email already in use'), { status: 409 });
      data.email = email;
    }
    if (input.password) {
      if (input.password.length < 8) throw Object.assign(new Error('Password must be at least 8 characters'), { status: 400 });
      data.password = await bcrypt.hash(input.password, 10);
    }
    await UserModel.update(id, data);
    return this.getSafeUser(id);
  },
  async listUsers() {
    return UserModel.findAll();
  },
};