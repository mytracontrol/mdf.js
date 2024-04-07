/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Crash, Multi } from '@mdf.js/crash';
import { undoMocks } from '@mdf.js/utils';
import fs from 'fs';
import { SettingsManager } from '.';

describe('#SettingsManager', () => {
  beforeEach(() => {
    undoMocks();
  });
  describe('#Happy path', () => {
    beforeEach(() => {
      undoMocks();
    });
    it(`Should create a valid instance of SettingsManager with default values`, async () => {
      const manager = new SettingsManager();
      expect(manager).toBeInstanceOf(SettingsManager);
      expect(manager.name).toEqual('settings');
      expect(manager.componentId).toBeDefined();
      expect(manager.status).toEqual('warn');
      const checks = manager.checks;
      expect(checks).toEqual({
        'mdf-app:settings': [
          {
            status: 'warn',
            componentId: manager.componentId,
            componentType: 'setup service',
            observedValue: 'stopped',
            time: checks['mdf-app:settings'][0].time,
            output: undefined,
            scope: 'ServiceRegistry',
            observedUnit: 'status',
          },
          {
            status: 'warn',
            componentId: manager.componentId,
            componentType: 'setup service',
            observedValue: 'stopped',
            time: checks['mdf-app:settings'][1].time,
            output: undefined,
            scope: 'CustomSettings',
            observedUnit: 'status',
          },
        ],
      });
      expect(manager.error).toBeUndefined();
      expect(manager.metadata).toEqual({
        name: 'mdf-app',
        release: '0.0.0',
        version: '0',
        description: undefined,
        instanceId: manager.componentId,
      });
      expect(manager.namespace).toBeUndefined();
      expect(manager.release).toEqual('0.0.0');
      expect(manager.observability).toEqual({
        metadata: {
          name: 'mdf-app',
          release: '0.0.0',
          version: '0',
          description: undefined,
          instanceId: manager.componentId,
        },
        service: {
          primaryPort: 9080,
          host: 'localhost',
          isCluster: false,
          includeStack: false,
          clusterUpdateInterval: 10000,
          maxSize: 100,
        },
      });
      expect(manager.logger).toEqual({
        console: {
          enabled: true,
          level: 'info',
        },
        file: {
          enabled: false,
          level: 'info',
        },
      });
      expect(manager.isPrimary).toBeFalsy();
      expect(manager.isWorker).toBeFalsy();
      expect(manager.serviceRegisterConfigManager).toBeDefined();
      expect(manager.serviceRegistrySettings).toBeDefined();
      expect(manager.customRegisterConfigManager).toBeDefined();
      expect(manager.customSettings).toEqual({});
      expect(manager.settings).toEqual({
        metadata: {
          name: 'mdf-app',
          release: '0.0.0',
          version: '0',
          description: undefined,
          instanceId: manager.componentId,
        },
        retryOptions: {
          attempts: 3,
          maxWaitTime: 10000,
          timeout: 5000,
          waitTime: 1000,
        },
        observabilityOptions: {
          primaryPort: 9080,
          host: 'localhost',
          isCluster: false,
          includeStack: false,
          clusterUpdateInterval: 10000,
          maxSize: 100,
        },
        loggerOptions: {
          console: {
            enabled: true,
            level: 'info',
          },
          file: {
            enabled: false,
            level: 'info',
          },
        },
        configLoaderOptions: {
          configFiles: ['./config/custom/*.*'],
          presetFiles: ['./config/custom/presets/*.*'],
          schemaFiles: ['./config/custom/schemas/*.*'],
          preset: undefined,
        },
        custom: {},
      });
      expect(manager.retryOptions).toEqual({
        attempts: 3,
        maxWaitTime: 10000,
        timeout: 5000,
        waitTime: 1000,
      });
      expect(manager.router).toBeDefined();
      expect(manager.links).toEqual({
        settings: {
          config: '/settings/config',
          presets: '/settings/presets',
          readme: '/settings/readme',
        },
      });
      await manager.start();
      expect(manager.status).toEqual('pass');
      await manager.stop();
      await manager.close();
    });
  });
  describe('#Sad path', () => {
    beforeEach(() => {
      undoMocks();
    });
    it(`Should create a valid instance of SettingsManager when there is a problem reading the "package.json" file`, async () => {
      jest
        .spyOn(fs, 'readFileSync')
        .mockImplementationOnce((value: any) => {
          throw new Crash('Error reading package.json');
        })
        .mockImplementationOnce((value: any) => {
          throw new Multi('Error reading readme.json', { causes: [new Crash(`myError`)] });
        });
      const manager = new SettingsManager({
        loadPackage: true,
        loadReadme: true,
        useEnvironment: true,
      });
      expect(manager).toBeInstanceOf(SettingsManager);
      expect(manager.error).toBeDefined();
      expect((manager.error as Multi).causes?.length).toEqual(2);
      expect(manager.error?.trace()).toEqual([
        'CrashError: Error loading README.md info: Error reading package.json',
        'caused by CrashError: Error reading package.json',
        'CrashError: Error loading package info: Error reading readme.json',
        'caused by MultiError: Error reading readme.json',
        'failed with CrashError: myError',
      ]);
    });
  });
});
