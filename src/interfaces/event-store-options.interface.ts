import { IEvent } from '@nestjs/cqrs';
import { ConsumerConfig, KafkaConfig } from 'kafkajs';

export interface EventStoreOptions {
  client?: KafkaConfig;
  consumer?: ConsumerConfig;
  eventHandlers?: IEventConstructors;
}

export interface IEventConstructors {
  [key: string]: (...args: any[]) => IEvent;
}
