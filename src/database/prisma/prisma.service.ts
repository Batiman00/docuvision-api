import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import   { PrismaClient as PrismaClientMongoDB } from "../../../prisma/generated/db2";

@Injectable()
export class PrismaService extends PrismaClient {
  constructor(config: ConfigService) {
    super({
      datasources: {
        db: {
          url: config.get('DATABASE_URL'),
        },
      },
    });
  }

  cleanDb() {
    return this.$transaction([
      this.user.deleteMany(),
      this.passwordReset.deleteMany(),
    ]);
  }
}

@Injectable()
export class PrismaServiceMongoDB extends PrismaClientMongoDB {
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
