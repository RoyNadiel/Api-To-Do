import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseService } from '../database/database.service';
import { TokenRevocationService } from './token-revocation.service';

interface UserRow {
  id: number;
  email: string;
  contrasena: string;
  nombre: string | null;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly db: DatabaseService,
    private readonly jwtService: JwtService,
    private readonly tokenRevocation: TokenRevocationService,
  ) {}

  /**
   * Valida credenciales del usuario contra la base de datos.
   */
  async validateUser(email: string, password: string): Promise<Omit<UserRow, 'contrasena'>> {
    const user = await this.db.queryOne<UserRow>(
      'SELECT id, email, contrasena, nombre FROM usuarios WHERE email = $1',
      [email],
    );

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const isPasswordValid = await bcrypt.compare(password, user.contrasena);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { contrasena: _, ...result } = user;
    return result;
  }

  /**
   * Genera un JWT firmado con RS256.
   * Payload: { sub, email, jti }
   */
  login(user: { id: number; email: string }): { token: string } {
    const jti = uuidv4();
    const payload = {
      sub: user.id,
      email: user.email,
      jti,
    };

    const token = this.jwtService.sign(payload);
    return { token };
  }

  /**
   * Revoca el token actual agregando su JTI a la lista de revocación.
   */
  logout(jti: string, exp: number): void {
    this.tokenRevocation.revoke(jti, exp);
  }
}
