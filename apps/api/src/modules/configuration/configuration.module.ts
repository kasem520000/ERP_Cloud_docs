import { Module } from '@nestjs/common'; import { ConfigurationController } from './presentation/configuration.controller.js';
@Module({ controllers: [ConfigurationController] }) export class ConfigurationModule {}
