import { Type } from '@nestjs/common';
import { IEvent } from '@nestjs/cqrs';
import { ConsumerConfig, KafkaConfig } from 'kafkajs';

export interface EventStoreOptions {
  client?: KafkaConfig;
  consumer?: ConsumerConfig;
  events?: IEvents;
}

type Event = new (...args: any[]) => IEvent;
export type IEvents = Event[];

export interface IEventConstructors {
  [key: string]: Event;
}
