import { DynamicModule, Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { AppConfig } from './config/app-config';
import { ConfigModule } from './config/config.module';
import { HealthController } from './health/health.controller';
import { IdentityModule } from './modules/identity/identity.module';
import { SyncModule } from './modules/sync/sync.module';
import { ProblemDetailsFilter } from './shared/presentation/http/problem-details.filter';
import { SharedModule } from './shared/shared.module';

@Module({})
export class AppModule {
  static register(config: AppConfig): DynamicModule {
    return {
      module: AppModule,
      imports: [ConfigModule.forRoot(config), SharedModule, IdentityModule, SyncModule],
      controllers: [HealthController],
      providers: [{ provide: APP_FILTER, useClass: ProblemDetailsFilter }],
    };
  }
}
