process.env.DEBUG = 'test:*';
import { JSONLArchiver } from '@mdf.js/jsonl-archiver-provider';
import { Logger } from '@mdf.js/logger';

const logger = new Logger('test', {
  console: { enabled: true, level: 'debug' },
  file: { enabled: true, level: 'debug' },
});
const provider = JSONLArchiver.Factory.create({
  config: {
    createFolders: true,
    rotationSize: 1024 * 1024 * 1,
    rotationInterval: 5 * 60 * 1000,
    rotationLines: 2000,
    propertyFileName: 'file',
  },
  logger,
});

provider.on('error', error => {
  logger.error(error);
});
provider.client.on('rotate', file => {
  logger.info(JSON.stringify(file, null, 2));
});

await provider.start();
while (true) {
  await provider.client.append({
    hello: 'world',
    time: new Date().toISOString(),
    pid: process.pid,
    file: 'a',
  });
  await new Promise(resolve => setTimeout(resolve, 100));
  await provider.client.append({
    hello: 'world',
    time: new Date().toISOString(),
    pid: process.pid,
    file: 'b',
  });
  await new Promise(resolve => setTimeout(resolve, 100));
  await provider.client.append({
    hello: 'world',
    time: new Date().toISOString(),
    pid: process.pid,
    file: 'c',
  });
  await new Promise(resolve => setTimeout(resolve, 100));
}
