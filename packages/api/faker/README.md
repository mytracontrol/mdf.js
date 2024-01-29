# **@mdf.js/faker**

[![Node Version](https://img.shields.io/static/v1?style=flat\&logo=node.js\&logoColor=green\&label=node\&message=%3E=16%20||%2018\&color=blue)](https://nodejs.org/en/)
[![Typescript Version](https://img.shields.io/static/v1?style=flat\&logo=typescript\&label=Typescript\&message=4.8\&color=blue)](https://www.typescriptlang.org/)
[![Known Vulnerabilities](https://img.shields.io/static/v1?style=flat\&logo=snyk\&label=Vulnerabilities\&message=0\&color=300A98F)](https://snyk.io/package/npm/snyk)

<!-- markdownlint-disable MD033 MD041 -->

<p align="center">
  <div style="text-align:center;background-image:radial-gradient(circle farthest-corner at 50% 50%, #104c60, #0c0c13);">
    <img src="https://assets.website-files.com/626a3ef32d23835d9b2e4532/6290ab1e2d3e0d922913a6e3_digitalizacion_ENG.svg"alt="netin"width="500">
  </div>
</p>

<h1 style="text-align:center;margin-bottom:0">Mytra Development Framework - @mdf.js </h1>
<h5 style="text-align:center;margin-top:0">Typescript tools for development</h5>

<!-- markdownlint-enable MD033 -->

***

## **Table of contents**

- [**@mdf.js/faker**](#mdfjsfaker)
  - [**Table of contents**](#table-of-contents)
  - [**Introduction**](#introduction)
  - [**Installation**](#installation)
  - [**Information**](#information)
    - [Programmatic Generation of Attributes](#programmatic-generation-of-attributes)
    - [Batch Specification of Attributes](#batch-specification-of-attributes)
    - [Post Build Callback](#post-build-callback)
    - [Associate a Factory with an existing Class](#associate-a-factory-with-an-existing-class)
  - [**Use**](#use)
  - [**License**](#license)

## **Introduction**

Faker is a tool to generate fake data for testing purposes based on [rosie](https://www.npmjs.com/package/rosie) package with some improvements.

To use `@mdf.js/faker` you first define a factory. The factory is defined in terms of attributes, sequences, options, callbacks, and can inherit from other factories. Once the factory is defined you use it to build objects.

## **Installation**

- **npm**

```bash
npm install @mdf.js/faker
```

- **yarn**

```bash
yarn add @mdf.js/faker
```

## **Information**

There are two phases of use:

1. Factory definition
2. Object building

**Factory Definition:** Define a factory, specifying attributes, sequences, options, and callbacks:

```typescript
import { Factory } from '@mdf.js/faker';
interface Player {
  id: number;
  name: string;
  position: string;
}

interface Game {
  id: number;
  is_over: boolean;
  created_at: Date;
  random_seed: number;
  players: Player[];
}

const playerFactory = new Factory<Player>()
  .sequence('id')
  .sequence('name', i => {
    return 'player' + i;
  })

  // Define `position` to depend on `id`.
  .attr('position', ['id'], id => {
    const positions = ['pitcher', '1st base', '2nd base', '3rd base'];
    return positions[id % positions.length];
  });

const gameFactory = new Factory<Game>()
  .sequence('id')
  .attr('is_over', false)
  .attr('created_at', () => new Date())
  .attr('random_seed', () => Math.random())
  // Default to two players. If players were given, fill in
  // whatever attributes might be missing.
  .attr('players', ['players'], players => {
    if (!players) {
      players = [{}, {}];
    }
    return players.map(data => playerFactory.build(data));
  });

const disabledPlayer = new Factory().extend(playerFactory).attr('state', 'disabled');
```

**Object Building:** Build an object, passing in attributes that you want to override:

```js
const game = gameFactory.build({ is_over: true });
// Built object (note scores are random):
//{
//    id:           1,
//    is_over:      true,   // overriden when building
//    created_at:   Fri Apr 15 2011 12:02:25 GMT-0400 (EDT),
//    random_seed:  0.8999513240996748,
//    players: [
//                {id: 1, name:'Player 1'},
//                {id: 2, name:'Player 2'}
//    ]
//}
```

### Programmatic Generation of Attributes

You can specify options that are used to programmatically generate the attributes:

```typescript
import { Factory } from '@mdf.js/faker';
import moment from 'moment';

interface Match {
  matchDate: string;
  homeScore: number;
  awayScore: number;
}

const matchFactory = new Factory<Match>()
  .attr('seasonStart', '2016-01-01')
  .option('numMatches', 2)
  .attr('matches', ['numMatches', 'seasonStart'], (numMatches, seasonStart) => {
    const matches = [];
    for (const i = 1; i <= numMatches; i++) {
      matches.push({
        matchDate: moment(seasonStart).add(i, 'week').format('YYYY-MM-DD'),
        homeScore: Math.floor(Math.random() * 5),
        awayScore: Math.floor(Math.random() * 5),
      });
    }
    return matches;
  });

matchFactory.build({ seasonStart: '2016-03-12' }, { numMatches: 3 });
// Built object (note scores are random):
//{
//  seasonStart: '2016-03-12',
//  matches: [
//    { matchDate: '2016-03-19', homeScore: 3, awayScore: 1 },
//    { matchDate: '2016-03-26', homeScore: 0, awayScore: 4 },
//    { matchDate: '2016-04-02', homeScore: 1, awayScore: 0 }
//  ]
//}
```

In the example `numMatches` is defined as an `option`, not as an `attribute`. Therefore `numMatches` is not part of the output, it is only used to generate the `matches` array.

In the same example `seasonStart` is defined as an `attribute`, therefore it appears in the output, and can also be used in the generator function that creates the `matches` array.

### Batch Specification of Attributes

The convenience function `attrs` simplifies the common case of specifying multiple attributes in a batch. Rewriting the `game` example from above:

```typescript
const gameFactory = new Factory()
  .sequence('id')
  .attrs({
    is_over: false,
    created_at: () => new Date(),
    random_seed: () => Math.random(),
  })
  .attr('players', ['players'], players => {
    /* etc. */
  });
```

### Post Build Callback

You can also define a callback function to be run after building an object:

```typescript
interface Coach {
  id: number;
  players: Player[];
}

const coachFactory = new Factory()
  .option('buildPlayer', false)
  .sequence('id')
  .attr('players', ['id', 'buildPlayer'], (id, buildPlayer) => {
    if (buildPlayer) {
      return [Factory.build('player', { coach_id: id })];
    }
  })
  .after((coach, options) => {
    if (options.buildPlayer) {
      console.log('built player:', coach.players[0]);
    }
  });

Factory.build({}, { buildPlayer: true });
```

Multiple callbacks can be registered, and they will be executed in the order they are registered. The callbacks can manipulate the built object before it is returned to the callee.

If the callback doesn't return anything, `@mdf.js/faker` will return build object as final result. If the callback returns a value, `@mdf.js/faker` will use that as final result instead.

### Associate a Factory with an existing Class

This is an advanced use case that you can probably happily ignore, but store this away in case you need it.

When you define a factory you can optionally provide a class definition, and anything built by the factory will be passed through the constructor of the provided class.

Specifically, the output of `.build` is used as the input to the constructor function, so the returned object is an instance of the specified class:

```js
class SimpleClass {
  constructor(args) {
    this.moops = 'correct';
    this.args = args;
  }

  isMoopsCorrect() {
    return this.moops;
  }
}

testFactory = Factory.define('test', SimpleClass).attr('some_var', 4);

testInstance = testFactory.build({ stuff: 2 });
console.log(JSON.stringify(testInstance, {}, 2));
// Output:
// {
//   "moops": "correct",
//   "args": {
//     "stuff": 2,
//     "some_var": 4
//   }
// }

console.log(testInstance.isMoopsCorrect());
// Output:
// correct
```

Mind. Blown.

## **Use**

To use `@mdf.js/faker` in node, you'll need to import it first:

```js
import { Factory } from '@mdf.js/faker';
// or with `require`
const Factory = require('@mdf.js/faker').Factory;
```

You might also choose to use unregistered factories, as it fits better with node's module pattern:

```typescript
// factories/game.js
import { Factory } from '@mdf.js/faker';

export default new Factory().sequence('id').attr('is_over', false);
// etc
```

To use the unregistered `Game` factory defined above:

```js
import Game from './factories/game';

const game = Game.build({ is_over: true });
```

You can also extend an existing unregistered factory:

```js
// factories/scored-game.js
import { Factory } from '@mdf.js/faker';
import Game from './game';

export default new Factory().extend(Game).attrs({
  score: 10,
});
```

## **License**

Copyright 2024 Mytra Control S.L. All rights reserved.

Use of this source code is governed by an MIT-style license that can be found in the LICENSE file or at <https://opensource.org/licenses/MIT>.
