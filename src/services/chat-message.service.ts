import { SERVER_CONFIG } from "../config/server-config";
import { prisma } from "../prisma/db";
import type { ChatMessage } from "../types/chat-message.types";

class ChatMessageService {
  //! mensajes grupales
  async sendGroupMessage(
    content: string,
    senderId: string,
    groupId?: string,
  ): Promise<ChatMessage> {
    if (!groupId) {
      const defaultGroup = await prisma.group.findFirst({
        where: {
          name: SERVER_CONFIG.defaultChannelName,
        },
      });

      if (!defaultGroup) {
        throw new Error(`Default group not found`);
      }

      groupId = defaultGroup.id;
    }

    const sender = await prisma.user.findFirst({
      where: {
        id: senderId,
      },
    });

    if (!sender) {
      throw new Error(`User not found`);
    }

    const groupMessage = await prisma.groupMessage.create({
      data: {
        content,
        groupId,
        senderId,
      },
    });

    return {
      id: groupMessage.id,
      content,
      createdAt: groupMessage.createdAt.getTime(),
      groupId,
      sender: { email: sender.email, id: senderId, name: sender.name },
    };
  }

  async getGroupMessages(groupId: string): Promise<ChatMessage[]> {
    const messages = await prisma.groupMessage.findMany({
      where: {
        groupId,
      },
      include: { sender: true },
      orderBy: {
        createdAt: "desc",
      },
      take: 30,
    });

    return messages.map((message) => ({
      id: message.id,
      groupId,
      content: message.content,
      createdAt: message.createdAt.getTime(),
      sender: {
        email: message.sender.email,
        name: message.sender.name,
        id: message.sender.id,
      },
    }));
  }

  //! mensajes directos
  async getDirectMessages(
    receiverId: string,
    senderId: string,
  ): Promise<ChatMessage[]> {
    const messages = await prisma.directMessage.findMany({
      where: {
        receiverId,
        senderId,
      },
      include: { sender: true },
      orderBy: {
        createdAt: "desc",
      },
      take: 30,
    });

    return messages.map((message) => ({
      id: message.id,
      content: message.content,
      createdAt: message.createdAt.getTime(),
      receiverId: message.senderId,
      sender: {
        id: message.sender.id,
        email: message.sender.email,
        name: message.sender.name,
      },
    }));
  }

  async sendDirectMessage(
    content: string,
    senderId: string,
    receiverId: string,
  ): Promise<ChatMessage> {
    const directMessage = await prisma.directMessage.create({
      data: {
        content,
        senderId,
        receiverId,
      },
    });

    const message = await prisma.directMessage.findUnique({
      where: { id: directMessage.id },
      include: {
        sender: true,
      },
    });

    if (!message) {
      throw new Error(`Failed to create direct message`);
    }

    return {
      id: directMessage.id,
      content: directMessage.content,
      createdAt: directMessage.createdAt.getTime(),
      sender: {
        id: message.senderId,
        email: message.sender.email,
        name: message.sender.name,
      },
    };
  }
}

export const chatMessageService = new ChatMessageService();
