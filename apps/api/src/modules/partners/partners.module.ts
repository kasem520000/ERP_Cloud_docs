import { Module } from '@nestjs/common';
import { PartnersController } from './presentation/partners.controller.js';
import { PartnersContactsController } from './presentation/partners-contacts.controller.js';
import { CreditTermsController } from './presentation/credit-terms.controller.js';
import { CreditCheckController } from './presentation/credit-check.controller.js';
import { OpeningBalancesController } from './presentation/opening-balances.controller.js';

@Module({
  controllers: [PartnersController, PartnersContactsController, CreditTermsController, CreditCheckController, OpeningBalancesController],
})
export class PartnersModule {}
