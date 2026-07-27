import { Injectable } from '@nestjs/common';

/**
 * Servicio de revocación de tokens en memoria.
 * Almacena JTIs (JWT IDs) de tokens revocados.
 * En producción, esto debería usar Redis u otro store persistente.
 */
@Injectable()
export class TokenRevocationService {
  // Map<jti, expirationTimestamp> — permite limpiar tokens expirados
  private readonly revokedTokens = new Map<string, number>();

  // Intervalo de limpieza: cada 15 minutos
  private readonly cleanupInterval: ReturnType<typeof setInterval>;

  constructor() {
    this.cleanupInterval = setInterval(() => this.cleanup(), 15 * 60 * 1000);
  }

  /**
   * Revoca un token agregando su JTI al store.
   * @param jti - JWT ID único del token
   * @param exp - Timestamp de expiración del token (epoch seconds)
   */
  revoke(jti: string, exp: number): void {
    this.revokedTokens.set(jti, exp);
  }

  /**
   * Verifica si un token ha sido revocado.
   */
  isRevoked(jti: string): boolean {
    return this.revokedTokens.has(jti);
  }

  /**
   * Limpia tokens expirados del store para liberar memoria.
   */
  private cleanup(): void {
    const now = Math.floor(Date.now() / 1000);
    for (const [jti, exp] of this.revokedTokens.entries()) {
      if (exp < now) {
        this.revokedTokens.delete(jti);
      }
    }
  }

  onModuleDestroy(): void {
    clearInterval(this.cleanupInterval);
  }
}
