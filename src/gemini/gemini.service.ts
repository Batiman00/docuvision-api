import { Injectable } from '@nestjs/common';
import { GoogleGenerativeAI, GenerateContentRequest, TextPart, Content } from '@google/generative-ai';

@Injectable()
export class GeminiService {
  private genAI: GoogleGenerativeAI;

  constructor() {this.genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);}

  async generateText(prompt: string): Promise<string> {
    try {
      const model = await this.genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL });
      const request: GenerateContentRequest = {
        contents: [
          {
            role: 'user',
            parts: [
              { text: prompt } as TextPart  
            ]
          } as Content
        ],
      };

      const result = await model.generateContent(request);

      return result.response.text();
    } catch (error) {
      console.error('Error generating text:', error);
      throw new Error('Failed to generate text from Gemini');
    }
  }
}
