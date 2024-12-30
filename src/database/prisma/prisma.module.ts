import { Global, Module } from '@nestjs/common';
import { PrismaServiceMongoDB } from './prisma.service';

@Global()
@Module({
  providers: [PrismaServiceMongoDB],
  exports: [PrismaServiceMongoDB],
})
export class PrismaModule {}