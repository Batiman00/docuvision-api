import {
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';
import * as argon from 'argon2';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthDto, UserDto } from './dto';
import * as schema from 'src/drizzle/schema';
import { DRIZZLE } from 'src/database/Drizzle/drizzle.provider';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';

@Injectable()
export class AuthService {
  constructor(
    @Inject(DRIZZLE) private db: NodePgDatabase<typeof schema>,
    private jwt: JwtService,
    private config: ConfigService,
  ) { }

  async signup(dto: UserDto) {
    try {
      const user  = await this.db.query.users.findFirst({
        where : eq(schema.users.email, dto.email)
      })
      if (user) {
        throw new ForbiddenException(
          'Credentials taken',
        );
      }
      const hash = await argon.hash(dto.password);
      
      const newUser = await this.db.insert(schema.users).values({ 
        name: dto.username,
        password : hash,
        email : dto.email
       } as typeof schema.users.$inferInsert).returning() ;
      return this.signToken(newUser[0].id, newUser[0].email, newUser[0].name);
    } catch (error) {
      throw error;
    }
  }

  async signin(dto: AuthDto) {
    const user  = await this.db.query.users.findFirst({
      where : eq(schema.users.email, dto.email)
    })
    if (!user)
      throw new ForbiddenException(
        'Credentials incorrect',
      );
    const pwMatches = await argon.verify(
      user.password,
      dto.password,
    );
    if (!pwMatches) {
      throw new ForbiddenException(
        'Credentials incorrect',
      );
    }
    return this.signToken(user.id, user.email, user.name);
  }

  async signToken(
    userId: string,
    email: string,
    name: string
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