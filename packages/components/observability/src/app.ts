import { Receiver, Sender } from '@mdf.js/amqp-provider';
import { EventContext, ReceiverEvents } from 'rhea-promise';
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
const myReceiver = Receiver.Factory.create({
  name: 'myReceiver',
  config: {
    reconnect: true,
    max_reconnect_delay: 10000,
    initial_reconnect_delay: 1000,
    receiver_options: {
      name: 'myName',
      credit_window: 0,
      autoaccept: false,
      autosettle: false,
      source: { address: 'stream.alarms::alarms.realtime' },
    },
  },
  useEnvironment: 'CONFIG_AMQP',
});
const mySender = Sender.Factory.create({
  name: 'mySender',
  config: {
    sender_options: {
      name: 'myName',
      autosettle: true,
      target: { address: 'stream.alarms::alarms.realtime' },
    },
  },
});

obs.health.register([myReceiver, mySender]);
obs
  .start()
  .then(() => {
    console.log('Observability started');
  })
  .then(() => myReceiver.start())
  .then(() => {
    myReceiver.client.on(ReceiverEvents.receiverOpen, (context: EventContext) => {
      myReceiver.client.drainCredit();
      myReceiver.client.addCredit(10);
    });
    myReceiver.client.on(ReceiverEvents.message, (context: EventContext) => {
      const timeout = (((context.message?.message_id as number) ?? 0) + 1) * 1000;
      console.log(`Timeout of  ${timeout}`);
      setTimeout(() => {
        console.log(context.message?.message_id);
        context.delivery?.accept();
        myReceiver.client.addCredit(1);
      }, timeout);
    });
  })
  .then(() => mySender.start())
  //.then(() => myreceiber.client.setCreditWindow(10))
  .then(() => myReceiver.client.addCredit(10))
  .then(async () => {
    for await (let i of generator()) {
      await mySender.client.send({
        body: 'Hello World!',
        message_id: i++,
        to: 'stream.alarms::alarms.realtime',
        //ttl: 1000,
      });
    }
  });
