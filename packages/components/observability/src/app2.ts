import { Consumer, Producer } from '@mdf.js/kafka-provider';
import { Observability } from '.';

async function* generator() {
  let i = 0;
  while (i < 30) {
    yield i++;
  }
}
const obs = new Observability({
  description: 'Mytra Control S.L.',
  name: 'Mytra Control S.L.',
  version: '1',
  release: '1.0.0',
  port: 3000,
  processId: 'mytra-control-s-l',
});
const myProducer = Producer.Factory.create({
  name: 'myProducer',
  config: {
    client: {
      brokers: ['localhost:9092', 'localhost:9093', 'localhost:9094'],
    },
  },
  useEnvironment: 'CONFIG_AMQP',
});
const myConsumer = Consumer.Factory.create({
  name: 'mySender',
  config: {
    client: {
      brokers: ['localhost:9092', 'localhost:9093', 'localhost:9094'],
    },
    consumer: {
      groupId: 'my-group',
    },
  },
});

obs.health.register([myProducer, myConsumer]);
obs
  .start()
  .then(() => {
    console.log('Observability started');
  })
  .then(() => myProducer.start())
  .then(() => myConsumer.start())
  .then(() => myConsumer.client.subscribe({ topic: 'my-topic' }))
  .then(() =>
    myConsumer.client.run({
      eachMessage: async ({ topic, partition, message }) => {
        console.log({
          value: message.value?.toString(),
        });
      },
    })
  )
  .then(async () => {
    for await (const i of generator()) {
      await myProducer.client.send({
        topic: 'my-topic',
        messages: [{ value: `Hello World ${i}` }],
      });
    }
  });
