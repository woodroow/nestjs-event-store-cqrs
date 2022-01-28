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
  private eventHandlers: IEventConstructors;

  private clientConfig: KafkaConfig;
  private consumerConfig: ConsumerConfig;

  constructor(
    @Inject(EVENT_STORE_OPTIONS) options: EventStoreOptions,
    private readonly eventBus: EventBus,
  ) {
    this.addEventHandlers(options.eventHandlers);
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
      Object.keys(this.eventHandlers).map((topic) => {
        subscriptions.push(
          this.consumer.subscribe({
            topic: topic,
            fromBeginning: false,
          }),
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
          if (this.eventHandlers && this.eventHandlers[topic]) {
            const event = this.eventHandlers[topic](...Object.values(value));
            this.subject$.next(event);
          } else
            [
              this.logger.warn(
                `Event of type ${topic} not handled`,
                this.constructor.name,
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

    try {
      await this.producer.send(eventPayload);
    } catch (err) {
      this.logger.error(err);
    }
  }

  async bridgeEventsTo<T extends IEvent>(subject: Subject<T>): Promise<any> {
    this.subject$ = subject;
  }

  addEventHandlers(eventHandlers: IEventConstructors) {
    this.eventHandlers = { ...this.eventHandlers, ...eventHandlers };
  }
}
