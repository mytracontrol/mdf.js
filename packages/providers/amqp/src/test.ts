process.env['DEBUG'] = '*rhea*';
//import net from 'net';
import { ReceiverEvents } from 'rhea-promise';
import { Receiver } from './index';

const provider = Receiver.Factory.create({
  name: 'test',
  config: {
    username: 'netin-admin',
    password: 'ZXpte.ufWyLk',
    host: '10.10.20.41',
    container_id: 'myOwnContainerId',
    idle_time_out: 5000,
    reconnect: 5000,
    max_reconnect_delay: 10000,
    reconnect_limit: Number.MAX_SAFE_INTEGER,
    receiver_options: {
      source: 'stream.devices::devices.realtime',
      credit_window: 0,
      autosettle: true,
      autoaccept: false,
    },
    keepAlive: true,
    keepAliveInitialDelay: 1000,
    timeout: 5000,
    all_errors_non_fatal: true,
    // connection_details: (counter: number) => {
    //   console.log('Connection details called: ', counter);
    //   return {
    //     host: '10.10.20.41',
    //     port: 5672,
    //     transport: 'tcp',
    //     connect: (port: number, host: string, ...restOfConfig: any[]) => {
    //       console.log('Connect called: ', port, host, restOfConfig);
    //       const abort = new AbortController();
    //       return (
    //         net
    //           .createConnection(
    //             {
    //               port,
    //               host,
    //               signal: abort.signal,
    //               keepAlive: true,
    //               timeout: 5000,
    //               keepAliveInitialDelay: 1000,
    //             },
    //             restOfConfig[restOfConfig.length - 1]
    //           )
    //           // .on('timeout', () => {
    //           //   abort.abort();
    //           // })
    //           .on('connect', () => {
    //             console.log('Socket connected');
    //           })
    //       );
    //     },
    //   };
    // },
  },
  useEnvironment: false,
});

let lastStatus = 'unknown';

provider.on('status', status => {
  console.log('Provider status event: ', status);
  if (status === 'pass' && status !== lastStatus) {
    console.log('Provider status change to pass');
    provider.client.addCredit(1);
  }
  lastStatus = status;
});

let lastMessageId: any = '';
provider
  .start()
  .then(() => {
    console.log('Provider started');
    provider.client.on(ReceiverEvents.message, context => {
      console.log('Message received');
      if (context.message?.message_id !== lastMessageId) {
        console.log('The message is new: ', context.message?.message_id);
      } else {
        console.log('The message is a duplicate: ', context.message?.message_id);
      }
    });
    provider.client.addCredit(1);
  })
  .catch(err => {
    console.log('Provider error: ');
  });
