import { Controller, Get } from '@nestjs/common'; import { getPool } from '../../../../infra/db/db.js';
@Controller('api/v1/public/plans')
export class PublicPlansController {
  @Get() async list(){ const pool=getPool(); const r=await pool.query(`SELECT key, name, price_amount, currency_code, billing_period, limits, feature_keys FROM plans WHERE is_active=true ORDER BY price_amount`); return r.rows; }
}
