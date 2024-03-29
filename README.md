<h1 align="center">
NestJS Kafka Event Store CQRS
</h1>
<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo_text.svg" width="320" alt="Nest Logo" /></a>
</p>

[travis-image]: https://api.travis-ci.org/nestjs/nest.svg?branch=master
[travis-url]: https://travis-ci.org/nestjs/nest
[linux-image]: https://img.shields.io/travis/nestjs/nest/master.svg?label=linux
[linux-url]: https://travis-ci.org/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    
## Description

A lightweight **KafkaJS event-store** module for [CQRS](https://github.com/nestjs/cqrs) [Nest](https://github.com/kamilmysliwiec/nest) framework (node.js). It requires `@nestjs/cqrs` and `kafkajs`

## Installation

```bash
$ npm install --save nestjs-event-store-cqrs
$ npm install --save kafkajs
```

## Quick Start

```js
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { EventStoreModule } from 'nestjs-event-store-cqrs';

@Module({
  imports: [
    CqrsModule,
    EventStoreModule.forRoot({
      client: {
        clientId: 'hero',
        brokers: ['localhost:9092'],
      },
      consumer: {
        groupId: 'hero-consumer',
      },
      events: [HeroKilledDragonEvent],
    }),
  ]
})
export class AppModule {}
```

[**FULL EXAMPLE**](https://github.com/woodroow/nestjs-event-store-cqrs-example)
