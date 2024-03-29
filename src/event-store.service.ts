import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import {
  DEFAULT_CLIENT_CONFIG,
  DEFAULT_CONSUMER_CONFIG,
  EVENT_STORE_OPTIONS,
} from './constants';
import {
  EventStoreOptions,
  IEventConstructors,
  IEvents,
} from './interfaces/event-store-options.interface';
import {
  Consumer,
  ConsumerConfig,
  Kafka,
  KafkaConfig,
  Producer,
} from 'kafkajs';
import {
  EventBus,
  IEvent,
  IEventPublisher,
  IMessageSource,
} from '@nestjs/cqrs';
import { Subject } from 'rxjs';

@Injectable()
export class EventStoreService
  implements IEventPublisher, OnModuleInit, OnModuleDestroy, IMessageSource
{
  private logger = new Logger(this.constructor.name);
  private client: Kafka;
  private producer: Producer;
  private consumer: Consumer;
  private subject$: Subject<IEvent>;
  private events: IEvents = [];
  private eventsForSearch: IEventConstructors = {};

  private clientConfig: KafkaConfig;
  private consumerConfig: ConsumerConfig;

  constructor(
    @Inject(EVENT_STORE_OPTIONS) options: EventStoreOptions,
    private readonly eventBus: EventBus
  ) {
    this.addEvents(options.events);
    this.clientConfig = { ...DEFAULT_CLIENT_CONFIG, ...options.client };
    this.consumerConfig = { ...DEFAULT_CONSUMER_CONFIG, ...options.consumer };
  }

  async onModuleInit() {
    this.connect();
    this.logger.verbose('EventStore modile init');

    this.subject$ = (this.eventBus as any).subject$;
    this.bridgeEventsTo((this.eventBus as any).subject$);
    this.eventBus.publisher = this;
  }
  async onModuleDestroy() {
    await this.disconnect();
    this.logger.log('EventStore connection destroyed');
  }

  async connect() {
    this.client = new Kafka(this.clientConfig);
    this.producer = await this.client.producer();

    await this.producer.connect();
    this.logger.verbose('EventStore producer connected');
    this.consumer = await this.client.consumer(this.consumerConfig);

    await this.consumer.connect();
    this.logger.verbose('EventStore consumer connected');
    await this.subscribe();
  }

  async subscribe() {
    try {
      const subscriptions = [];
      this.events.forEach((event) => {
        subscriptions.push(
          this.consumer.subscribe({
            topic: event.name,
            fromBeginning: false,
          })
        );
      });
      if (!subscriptions.length) {
        this.logger.log('EventStore module was init without eventHandlers');
        return;
      }
      await Promise.all(subscriptions);
      await this.consumer.run({
        eachMessage: async ({ topic, message }) => {
          const value = JSON.parse(message.value.toString());
          if (this.events && this.eventsForSearch[topic]) {
            const func = new this.eventsForSearch[topic](
              ...Object.values(value)
            );
            this.subject$.next(func);
          } else
            [
              this.logger.warn(
                `Event of type ${topic} not handled`,
                this.constructor.name
              ),
            ];
        },
      });
    } catch (error) {
      this.logger.error(`subscribe event error: ${error.stack}`);
    }
  }
  async disconnect() {
    await this.producer?.disconnect();
    await this.consumer?.disconnect();
  }

  async publish(event: IEvent) {
    if (event === undefined) {
      return;
    }
    if (event === null) {
      return;
    }

    const eventPayload = {
      topic: event.constructor.name,
      messages: [{ value: JSON.stringify(event) }],
    };

    await this.producer.send(eventPayload);
  }

  async bridgeEventsTo<T extends IEvent>(subject: Subject<T>): Promise<any> {
    this.subject$ = subject;
  }

  addEvents(events: IEvents = []) {
    this.events = [...this.events, ...events];
    this.events.map((event) => {
      this.eventsForSearch[event.name] = event;
    });
  }
}
