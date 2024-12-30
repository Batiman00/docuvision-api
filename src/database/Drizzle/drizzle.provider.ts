import { drizzle, NodePgDatabase} from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from 'src/drizzle/schema'
import { ConfigService } from '@nestjs/config';
export const DRIZZLE = Symbol('drizzle-connection');

export const drizzleProvider = [
  {
    provide: DRIZZLE,
    inject: [ConfigService],
    useFactory: async (configService: ConfigService) => {
      const connectionString = configService.get<string>('DATABASE_URL');
      const pool = new Pool({
        connectionString,
      });

      return drizzle(pool, { schema }) as NodePgDatabase<typeof schema>;
    },
  },
];