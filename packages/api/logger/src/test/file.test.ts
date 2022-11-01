/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 * Note: All information contained herein is, and remains the property of Mytra Control S.L. and its
 * suppliers, if any. The intellectual and technical concepts contained herein are property of
 * Mytra Control S.L. and its suppliers and may be covered by European and Foreign patents, patents
 * in process, and are protected by trade secret or copyright.
 *
 * Dissemination of this information or the reproduction of this material is strictly forbidden
 * unless prior written permission is obtained from Mytra Control S.L.
 */

import { Crash } from '@mdf/crash';
import { retry } from '@mdf/utils';
import fs from 'fs';
import readline from 'readline';
import { Logger } from '../index';

const fileName = `logs/test-log-${process.pid}-${Math.random() * (10000 - 1) + 1}.log`;
//@ts-ignore - Test environment
const logger = new Logger(undefined, {
  file: {
    enabled: true,
    filename: fileName,
    json: true,
    level: 'silly',
    maxFiles: 1,
    maxsize: 1000,
    zippedArchive: false,
  },
});

describe('#Logger #file', () => {
  describe('#json format #good path', () => {
    const uuid = '02ef7b85-b88e-4134-b611-4056820cd689';
    const context = 'VERY-LONG-CONTEXT';
    it('Logging with or w/o uuid and context', async () => {
      let lineNumber = 1;
      logger.error('logging');
      logger.error('logging', uuid, context);
      logger.crash(
        new Crash('Crash error', uuid, {
          name: 'ExampleName',
          cause: new Crash('Crash error', uuid, {
            name: 'Other Example Name',
            cause: TypeError('typeError'),
            info: { otherExtra: 'extra' },
          }),
          info: { extra: 'extra' },
        }),
        context
      );
      const path = process.cwd() + '/' + fileName;
      const checkFile = (): Promise<void> => {
        return new Promise((resolve, reject) => {
          if (!fs.existsSync(path)) {
            reject();
          } else {
            resolve();
          }
        });
      };
      await retry(checkFile, [], { maxWaitTime: 150, waitTime: 50, attempts: 3 });
      expect(fs.existsSync(path)).toBeTruthy();
      const lineReader = readline.createInterface({
        input: fs.createReadStream(fileName),
      });
      lineReader.on('line', line => {
        if (lineNumber === 1) {
          expect(line).toContain('"meta":[]');
          expect(line).toContain('"message":"logging"');
          expect(line).toContain('"level":"error"');
          expect(line).toContain('"label":"mms-app"');
          expect(line).toContain('"pid":"');
          expect(line).toContain('"timestamp":"');
          lineNumber += 1;
        } else if (lineNumber === 2) {
          expect(line).toContain('"uuid":"02ef7b85-b88e-4134-b611-4056820cd689"');
          expect(line).toContain('"context":"VERY-LONG-CONTEXT"');
          expect(line).toContain('"meta":[]');
          expect(line).toContain('"level":"error"');
          expect(line).toContain('"message":"logging"');
          expect(line).toContain('"label":"mms-app"');
          expect(line).toContain('"pid":"');
          expect(line).toContain('"timestamp":"');

          lineNumber += 1;
        } else {
          expect(line).toContain('"cause":{');
          expect(line).toContain('"name":"ExampleName"');
          expect(line).toContain('"message":"Crash error"');
          expect(line).toContain('"uuid":"02ef7b85-b88e-4134-b611-4056820cd689"');
          expect(line).toContain(
            '"trace":["ExampleName: Crash error","caused by Other Example Name: Crash error","caused by TypeError: typeError"]'
          );
          expect(line).toContain('"context":"VERY-LONG-CONTEXT"');
          expect(line).toContain('"info":{"extra":"extra"}');
          expect(line).toContain('"label":"mms-app"');
          expect(line).toContain('"level":"error"');
          expect(line).toContain('"message":"Crash error"');
          expect(line).toContain('"uuid":"02ef7b85-b88e-4134-b611-4056820cd689"');
          expect(line).toContain('"pid":"');
          expect(line).toContain('"timestamp":"');
        }
      });
    }, 300);
  });
});
