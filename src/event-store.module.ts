import { DynamicModule, Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { EVENT_STORE_OPTIONS } from './constants';
import { EventStoreService } from './event-store.service';
import { EventStoreOptions } from './interfaces/event-store-options.interface';

export interface EventStoreModuleOptions {
  serviceName: string;
}

@Module({
  imports: [CqrsModule],
  providers: [EventStoreService],
  exports: [EventStoreService],
})
export class EventStoreModule {
  static register(options: EventStoreOptions): DynamicModule {
    return {
      module: EventStoreModule,
      providers: [
        {
          provide: EVENT_STORE_OPTIONS,
          useValue: options,
        },
        EventStoreService,
      ],
      exports: [EventStoreService],
    };
  }
  static forRoot(options: EventStoreOptions): DynamicModule {
    return {
      module: EventStoreModule,
      providers: [
        {
          provide: EVENT_STORE_OPTIONS,
          useValue: options,
        },
        EventStoreService,
      ],
      exports: [EventStoreService],
    };
  }
}
