import { Controller, Post, Body } from '@nestjs/common';
import { GeminiService } from './gemini.service';

@Controller('gemini')
export class GeminiController {
    constructor(private readonly geminiService: GeminiService) {}

    @Post('generate-text')
    async generateText(@Body('prompt') prompt: string): Promise<string> {
        return this.geminiService.generateText(prompt);
    }
}
