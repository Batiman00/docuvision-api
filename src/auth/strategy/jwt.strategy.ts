import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import {
  ExtractJwt,
  Strategy,
} from 'passport-jwt';
import { DRIZZLE } from 'src/database/Drizzle/drizzle.provider';
import * as schema from 'src/drizzle/schema';

@Injectable()
export class JwtStrategy extends PassportStrategy(
  Strategy,
  'jwt',
) {
  constructor(
    config: ConfigService,
    @Inject(DRIZZLE) private db: NodePgDatabase<typeof schema>
  ) {
    super({
      jwtFromRequest:
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.get('JWT_SECRET'),
    });
  }

  async validate(payload: {
    sub: string;
    email: string;
  }) {
    const user  = await this.db.query.users.findFirst({
          where : eq(schema.users.id, payload.sub)
        })
    delete user.password;
    return user;
  }
}