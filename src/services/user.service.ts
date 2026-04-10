import { prisma } from "../prisma/db";
import type { Sender } from "../types/chat-message.types";

class UserService {
  //todo: connectedUsers
  async getSenderById(userId: string): Promise<Sender | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return null;
    }

    return {
      email: user.email,
      id: user.id,
      name: user.name,
    };
  }
}

export const userService = new UserService();
