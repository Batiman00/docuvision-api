import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { GeminiService } from 'src/gemini/gemini.service';

@Module({
  controllers: [ChatController],
  providers: [ChatService, GeminiService]
})
export class ChatModule {}
