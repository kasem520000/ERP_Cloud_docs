import { Injectable, NestMiddleware } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction): void {
    const incoming = req.headers['x-request-id'] as string | undefined;
    const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const correlationId = incoming && uuidRe.test(incoming) ? incoming : uuidv4();
    (req as unknown as Record<string, unknown>).correlationId = correlationId;
    _res.setHeader('X-Request-Id', correlationId);
    next();
  }
}
