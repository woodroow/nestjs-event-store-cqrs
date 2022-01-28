import { ConsumerConfig, KafkaConfig } from 'kafkajs';

export const EVENT_STORE_OPTIONS = 'EVENT_STORE_OPTIONS';

export const DEFAULT_CLIENT_ID = 'nestjs-event-store-module';
export const DEFAULT_GROUP_ID = 'nestjs-event-store-module-consumer';

export const DEFAULT_CLIENT_CONFIG: KafkaConfig = {
  brokers: ['localhost:9092'],
};

export const DEFAULT_CONSUMER_CONFIG: ConsumerConfig = {
  groupId: DEFAULT_GROUP_ID,
};
