import { Injectable } from '@nestjs/common';
import { PrismaServiceMongoDB } from 'src/database/prisma/prisma.service';
import { SenderType, Chat } from "../../prisma/generated/db2";
import { ObjectId } from "mongodb";
import axios from 'axios';
import { GeminiService } from 'src/gemini/gemini.service';

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaServiceMongoDB, private readonly geminiService: GeminiService) {}

  async getChatMessages(chatId: string, userId: string): Promise<{ senderType: SenderType; content: string }[]> {
    const user = await this.prisma.user.findUnique({
        where : { User_ID_FK : userId}
    })
    const chat = await this.prisma.chat.findFirst({
      where: { userId: user.id,  ...(chatId ? { id: chatId } : {})},
      include: { user: true },
    });
  
    if (!chat) {
      throw new Error('Chat not found.');
    }
  
    const messages = await this.prisma.message.findMany({
      where: { chatId },
      orderBy: { timestamp: 'asc' },
      select: {
        senderType: true,
        content: true,
      },
    });
  
    return messages;
  }
  

  async getUserChats(userId: string): Promise<{ chatId: string; title: string }[]> {
    const user = await this.prisma.user.findUnique({
        where : { User_ID_FK : userId}
    })
    const userChats = await this.prisma.chat.findMany({
      where: { userId: user.id }, 
      select: {
        id: true, 
        title: true,
      },
    });

    return userChats.map(chat => ({
      chatId: chat.id,
      title: chat.title,
    }));
    }

  // Create or update chat
  async upsertChat(data: { chatId: string; text: string; userId: string; isUpload: boolean; senderType: SenderType }) : Promise<{ chat: Chat; userMessage: any }> {
    const user = await this.prisma.user.upsert({
      where: { User_ID_FK: data.userId },
      create: {
        id: new ObjectId().toString(),
        User_ID_FK: data.userId,
      },
      update: {},
      include: { chats: true },
    });

    let chat;
    if (data.chatId) {
      chat = await this.prisma.chat.findUnique({
        where: { id: data.chatId },
      });
    } else {
      let title =  await this.callGeminiApi(`Give un title of 2 or 3 words to the following text: ${data.text}`)
      chat = await this.prisma.chat.create({
        data: {
          title: title,
          userId: user.id,
        },
      });
    }

    if (!user.chats.some((existingChat) => existingChat.id === chat.id)) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          chats: {
            connect: { id: chat.id },
          },
        },
      });
    }

    // Create the user message in the chat
    const userMessage = await this.prisma.message.create({
      data: {
        senderType: data.senderType,
        content: data.text,
        chatId: chat.id,
        upload: data.isUpload,
      },
    });

    return { chat, userMessage };
  }

  // Call Gemini API for response to the question
  async callGeminiApi(question: string): Promise<string> {
    try{
      const response = this.geminiService.generateText(question)
      return response || 'No answer received from API';
    } catch (error) {
      console.error('Error with Gemini API:', error);
      throw new Error('Failed to fetch response from Gemini API');
    }
  }

  async receiveQuestionAndStoreResponse(data: { chatId: string; text: string; userId: string; isUpload: boolean; senderType: SenderType }) {
    // Use the upsertChat method to create or update the chat and message
    const  userMessage = await this.upsertChat({
      chatId: data.chatId,
      text: data.text,
      userId: data.userId,
      isUpload: data.isUpload,
      senderType: SenderType.USER,
    });
    const context = await this.prisma.message.findFirstOrThrow({
        where: {
          chatId : userMessage.chat.id,
          upload: true,
        },
        orderBy: {
          timestamp: 'desc', 
        },
      });

    let appenContext = "";
    if (context ){
        appenContext = `Considering the following context,${context.content} answer`
    }

    const botResponse = await this.callGeminiApi(appenContext + data.text);

    await this.upsertChat({
      chatId: userMessage.chat.id,
      text: botResponse,
      userId: data.userId,
      isUpload: data.isUpload,
      senderType: SenderType.BOT,
    });

    return { userMessage , botResponse };
  }
}
