import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaServiceMongoDB extends PrismaClient {
  constructor(config: ConfigService) {
    super({
      datasources: {
        db: {
          url: config.get('DATABASE_MONGODB_URL'),
        },
      },
    });
  }

  cleanDb() {
    return this.$transaction([
      this.chat.deleteMany(),
      this.user.deleteMany(),
      this.message.deleteMany(),
    ]);
  }
}
