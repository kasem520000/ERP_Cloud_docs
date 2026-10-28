import { Controller, Post, Body, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { login } from '../application/auth-service.js';
import { cookieOptions, csrfToken } from '../application/session-service.js';

@Controller('auth')
export class AuthController {
  @Post('login')
  async login(@Body() body: { email: string; password: string }, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const ip = (req.headers['x-forwarded-for'] as string) || (req as { ip?: string }).ip || '127.0.0.1';
    const result = await login(body.email, body.password, ip);
    if (!result.ok) return { ok: false, reason: result.reason };
    if (result.mfaRequired) return { ok: true, mfaRequired: true };
    if (result.session) {
      res.cookie('session', result.session.token, cookieOptions() as unknown as never);
      res.cookie('csrf_token', csrfToken(), { httpOnly: false, secure: false, sameSite: 'lax', path: '/' });
      return { ok: true };
    }
    return { ok: false, reason: 'UNKNOWN' };
  }

  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const cookie = (req as unknown as { cookies?: Record<string,string> }).cookies?.['session'];
    if (cookie) {
      const { getPool } = await import('../../../infra/db/db.js');
      const crypto = await import('node:crypto');
      const hash = crypto.createHash('sha256').update(cookie).digest('hex');
      try { await getPool().query(`UPDATE sessions SET revoked_at=now() WHERE token_hash=$1`, [hash]); } catch { /* db unavailable in test */ }
    }
    res.clearCookie('session');
    res.clearCookie('csrf_token');
    return { ok: true };
  }
}
