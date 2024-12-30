import { Request , Controller, Get, Post, UploadedFile, UseInterceptors, BadRequestException, Body, Query, UseGuards } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import * as Tesseract from 'tesseract.js';
import { ChatService } from './chat.service';
import * as multer from 'multer';
import { SenderType } from '@prisma/client';
import { AuthGuard } from '@nestjs/passport';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @UseGuards(AuthGuard('jwt'))
  @Get('messages')
  async getChatMessages(
    @Query('chatId') chatId: string,
    @Request() req
  ): Promise<{ chatTitle: string; messages: { senderType: SenderType; content: string }[] }> {
    if (!req.user.id) {
      throw new BadRequestException('User ID is required.');
    }
    if (!chatId) {
      throw new BadRequestException('chatId is required.');
    }
    try {
      const messages = await this.chatService.getChatMessages(chatId, req.user.id);
      return messages;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('user-chats')
  async getUserChats(@Request() req) {
    if (!req.user.id) {
      throw new BadRequestException('User ID is required.');
    }

    const chats = await this.chatService.getUserChats(req.user.id);
    return {
      message: 'Chats retrieved successfully.',
      data: chats,
    };
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('ocr')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: multer.memoryStorage(), // Store file in memory
      limits: { fileSize: 5 * 1024 * 1024 }, // Max file size: 5MB
      fileFilter: (req, file, callback) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
        if (!allowedTypes.includes(file.mimetype)) {
          return callback(new BadRequestException('Unsupported file type.'), false);
        }
        callback(null, true);
      },
    }),
  )
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Body('chatId') chatId: string | null,
    @Body('prompt') prompt: string,
    @Request() req,
  ) {
    let result = {};
    let chatID = chatId

    if (file) {
      try {
        const tesseractResult = await Tesseract.recognize(file.buffer, 'eng');
        const extractedText = tesseractResult.data.text;

        const {chat ,userMessage} = await this.chatService.upsertChat({
          chatId: chatId,
          text: extractedText,
          userId: req.user.id,
          isUpload: true,
          senderType: SenderType.BOT,
        });
        chatID = chat.id

        result = {
          message: 'Image processed and message saved successfully.',
          data: {"response" : userMessage,
            chat : {id : chat.id, title : chat.title}
          },
        };
      } catch (error) {
        console.log(error)
        throw new BadRequestException('Error processing image');
      }
    }

    if (prompt) {
      try {
        const { userMessage, botResponse } = await this.chatService.receiveQuestionAndStoreResponse({
          chatId: chatID,
          text: prompt,
          userId: req.user.id,
          isUpload : false,
          senderType : SenderType.USER
        });

        result = {
          message: 'Success',
          data: {"response":botResponse,
            chat : {id : userMessage.chat.id, title : userMessage.chat.title}
          },
        };
      } catch (error) {
        console.log(error)
        throw new BadRequestException('Error handling prompt');
      }
    }

    return result;
  }
}
