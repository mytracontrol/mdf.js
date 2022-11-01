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

import { JobHandler } from '@mdf/core';
import { Middleware } from '@mdf/middlewares';
import express from 'express';
import request from 'supertest';
import { Accessors } from '../helpers';
import { Registry } from '../modules';
import { Control } from '../types';
import { Router } from './oc2.router';

const COMMAND: Control.CommandMessage = {
  content_type: 'application/openc2+json;version=1.0',
  msg_type: Control.MessageType.Command,
  request_id: '3b6771cb-1ca6-4c1f-a06e-0b413872cd5c',
  created: 100,
  from: 'myProducer',
  to: ['*'],
  content: {
    action: Control.Action.Query,
    target: {
      'x-netin:alarms': { entity: '3b6771cb-1ca6-4c1f-a06e-0b413872cd5c' },
    },
    command_id: 'myCommandId',
    args: {
      duration: 50,
    },
  },
};

const app = express();
const myRegistry = new Registry('myRegistry');
myRegistry.push(COMMAND);
const job = new JobHandler(COMMAND, COMMAND.request_id, 'command', {
  headers: { duration: Accessors.getDelayFromCommandMessage(COMMAND) },
});
myRegistry.push(job);
job.done();
myRegistry.delete(job.uuid);
myRegistry.push(job);
const healthRoute = new Router(myRegistry);

app.use(Middleware.RequestId.handler());
app.use(healthRoute.router);
app.use(Middleware.ErrorHandler.handler());

describe('#Component #oc2', () => {
  describe('#Happy path', () => {
    it(`Should response 200 and array of messages when a GET request is performed over /openc2/messages`, done => {
      request(app)
        .get(`/openc2/messages`)
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .then(response => {
          expect(response.body).toEqual(myRegistry.messages);
          done();
        })
        .catch(error => {
          done(error);
        });
    }, 300);
    it(`Should response 200 and array of pendingJobs when a GET request is performed over /openc2/pendingJobs`, done => {
      request(app)
        .get(`/openc2/pendingJobs`)
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .then(response => {
          expect(response.body).toEqual(
            Array.from(myRegistry.pendingJobs.values()).map(job => ({
              ...job.result(),
              command: job.data,
            }))
          );
          done();
        })
        .catch(error => {
          done(error);
        });
    }, 300);
    it(`Should response 200 and array of executed jobs when a GET request is performed over /openc2/jobs`, done => {
      request(app)
        .get(`/openc2/jobs`)
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .then(response => {
          expect(response.body).toEqual(myRegistry.executedJobs);
          done();
        })
        .catch(error => {
          done(error);
        });
    }, 300);
    it(`Should response 400 and empty array when a GET request is performed over any not valid id`, done => {
      request(app)
        .get(`/openc2/nothing`)
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(400)
        .then(response => {
          expect(response.body).toEqual({
            code: 'HTTP',
            detail: 'Invalid parameter nothing',
            status: 400,
            title: 'Bad Request',
            uuid: response.body.uuid,
          });
          done();
        })
        .catch(error => {
          done(error);
        });
    }, 300);
    it(`Should response 204 when a GET request is performed over /openc2/messages and is empty`, done => {
      myRegistry.clear();
      request(app)
        .get(`/openc2/messages`)
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .expect(204)
        .then(response => {
          expect(response.body).toEqual({});
          done();
        })
        .catch(error => {
          done(error);
        });
    }, 300);
  });
});
