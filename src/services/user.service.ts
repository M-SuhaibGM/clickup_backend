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
  async listUsers() {
    return UserModel.findAll();
  },
};