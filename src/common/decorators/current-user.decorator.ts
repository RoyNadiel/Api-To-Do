import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Extrae el usuario autenticado del request (inyectado por JwtStrategy).
 * Uso: @CurrentUser() user: { userId: number; email: string }
 */
export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<Record<string, unknown>>();
  return request.user;
});
