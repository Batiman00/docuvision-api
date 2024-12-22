import { Global, Module } from '@nestjs/common';
import { PrismaService, PrismaServiceMongoDB } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService,PrismaServiceMongoDB],
  exports: [PrismaService,PrismaServiceMongoDB],
})
export class PrismaModule {}