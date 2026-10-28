import { Controller, Post, Body, Req } from '@nestjs/common';
import type { Request } from 'express';
import { registerTenant } from '../../application/registration-service.js';
@Controller('platform')
export class RegistrationController {
  @Post('register')
  async register(@Body() body: { name: string; nameAr?: string; countryCode: string; baseCurrency: string; industryTemplateKey?: string; ownerEmail: string; ownerName: string; ownerPassword: string; taxRegistered?: boolean; taxNumber?: string }, @Req() req: Request): Promise<{ tenantId: string; userId: string }> {
    const ip = (req.headers['x-forwarded-for'] as string) || (req as { ip?: string }).ip || '127.0.0.1';
    return registerTenant({ name: body.name, nameAr: body.nameAr, countryCode: body.countryCode, baseCurrency: body.baseCurrency, industryTemplateKey: body.industryTemplateKey, ownerEmail: body.ownerEmail, ownerName: body.ownerName, ownerPassword: body.ownerPassword, taxRegistered: body.taxRegistered, taxNumber: body.taxNumber }, ip);
  }
}
