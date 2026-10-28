import { Module } from '@nestjs/common';
import { ItemsController } from './presentation/items.controller.js';
import { ItemCategoriesController } from './presentation/item-categories.controller.js';
import { UomsController } from './presentation/uoms.controller.js';
import { PriceListsController } from './presentation/price-lists.controller.js';
import { ImportJobsController } from './presentation/import-jobs.controller.js';
import { PricingController } from './presentation/pricing.controller.js';
import { SearchController } from './presentation/search.controller.js';
import { AttachmentsController } from './presentation/attachments.controller.js';

@Module({
  controllers: [ItemsController, ItemCategoriesController, UomsController, PriceListsController, ImportJobsController, PricingController, SearchController, AttachmentsController],
})
export class ItemsModule {}
