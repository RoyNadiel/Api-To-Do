import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import * as fs from 'fs';
import * as path from 'path';
import { TokenRevocationService } from './token-revocation.service';

interface JwtPayload {
  sub: number;
  email: string;
  jti: string;
  exp: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly tokenRevocation: TokenRevocationService) {
    const publicKeyPath = path.join(process.cwd(), 'keys', 'public.pem');
    const publicKey = fs.readFileSync(publicKeyPath, 'utf-8');

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: publicKey,
      algorithms: ['RS256'],
    });
  }

  /**
   * Valida el payload del JWT.
   * Verifica que el token no haya sido revocado.
   */
  validate(payload: JwtPayload): {
    userId: number;
    email: string;
    jti: string;
    exp: number;
  } {
    if (this.tokenRevocation.isRevoked(payload.jti)) {
      throw new UnauthorizedException('Token revocado');
    }

    return {
      userId: payload.sub,
      email: payload.email,
      jti: payload.jti,
      exp: payload.exp,
    };
  }
}
