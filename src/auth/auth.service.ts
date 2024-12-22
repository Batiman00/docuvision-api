import {
    ForbiddenException,
    Injectable,
  } from '@nestjs/common';
  import * as argon from 'argon2';
  import { JwtService } from '@nestjs/jwt';
  import { ConfigService } from '@nestjs/config';
  import { AuthDto, UserDto } from './dto';
import { PrismaService } from 'src/database/prisma/prisma.service';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
  
  @Injectable()
  export class AuthService {
    constructor(
      private prisma: PrismaService,
      private jwt: JwtService,
      private config: ConfigService,
    ) {}
  
    async signup(dto: UserDto) {
      const hash = await argon.hash(dto.password);
      try {
        const user = await this.prisma.user.create({
          data: {
            email: dto.email,
            password: hash,
            name: dto.username
          },
        });
  
        return this.signToken(user.id, user.email, user.name);
      } catch (error) {
        if (
          error instanceof
          PrismaClientKnownRequestError
        ) {
          if (error.code === 'P2002') {
            throw new ForbiddenException(
              'Credentials taken',
            );
          }
        }
        throw error;
      }
    }
  
    async signin(dto: AuthDto) {
      const user =
        await this.prisma.user.findUnique({
          where: {
            email: dto.email,
          },
        });
      if (!user)
        throw new ForbiddenException(
          'Credentials incorrect',
        );
      const pwMatches = await argon.verify(
        user.password,
        dto.password,
      );
      if (!pwMatches){
        throw new ForbiddenException(
          'Credentials incorrect',
        );}
      return this.signToken(user.id, user.email, user.name);
    }
  
    async signToken(
      userId: string,
      email: string,
      name : string
    ): Promise<{ access_token: string }> {
      const payload = {
        sub: userId,
        email,
        name
      };
      const secret = this.config.get('JWT_SECRET');
      const token = await this.jwt.signAsync(
        payload,
        {
          expiresIn: '7d',
          secret: secret,
        },
      );
      return {
        access_token: token,
      };
    }
  }