import { Module } from '@nestjs/common';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { JwtAuthGuard } from './jwt-auth.guard';
import { TokenRevocationService } from './token-revocation.service';

@Module({
  imports: [
    ConfigModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService): JwtModuleOptions => {
        const privateKeyPath = path.join(process.cwd(), 'keys', 'private.pem');
        const privateKey = fs.readFileSync(privateKeyPath, 'utf-8');

        return {
          privateKey,
          signOptions: {
            algorithm: 'RS256' as const,
            expiresIn: config.get<string>('JWT_EXPIRATION', '1h') as unknown as number,
          },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtAuthGuard, TokenRevocationService],
  exports: [JwtAuthGuard, TokenRevocationService],
})
export class AuthModule {}
