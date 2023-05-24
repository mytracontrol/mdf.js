/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Jobs } from '@mdf.js/core';
import { Crash } from '@mdf.js/crash';
import { Middleware } from '@mdf.js/middlewares';
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
      duration: 1000,
    },
  },
};

const RESPONSE: Control.ResponseMessage = {
  content_type: 'application/openc2+json;version=1.0',
  msg_type: Control.MessageType.Response,
  request_id: '3b6771cb-1ca6-4c1f-a06e-0b413872cd5c',
  created: 100,
  from: 'myConsumer',
  to: ['myProducer'],
  status: Control.StatusCode.OK,
  content: {
    status: Control.StatusCode.OK,
    results: {},
  },
};

const app = express();
const myRegistry = new Registry('myRegistry');
myRegistry.push(COMMAND);
const job = new Jobs.JobHandler(COMMAND.request_id, COMMAND, 'command', {
  headers: { duration: Accessors.getDelayFromCommandMessage(COMMAND) },
});
myRegistry.push(job);
job.done();
myRegistry.delete(job.uuid);
myRegistry.push(job);
const oc2Route = new Router(myRegistry);

app.use(Middleware.BodyParser.JSONParserHandler());
app.use(Middleware.RequestId.handler());
app.use(oc2Route.router);
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
    it(`Should response 204 and an empty response when POST request is performed over /openc2/commands and an empty response is received`, done => {
      oc2Route.once('command', (command, response) => {
        expect(command).toEqual(COMMAND);
        response();
      });
      request(app)
        .post(`/openc2/command`)
        .send(COMMAND)
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
    it(`Should response 204 and an empty response when POST request is performed over /openc2/commands and an empty array is received`, done => {
      oc2Route.once('command', (command, response) => {
        expect(command).toEqual(COMMAND);
        response(undefined, []);
      });
      request(app)
        .post(`/openc2/command`)
        .send(COMMAND)
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
    it(`Should response 200 and a command response when POST request is performed over /openc2/commands and a response is received`, done => {
      oc2Route.once('command', (command, response) => {
        expect(command).toEqual(COMMAND);
        response(undefined, RESPONSE);
      });
      request(app)
        .post(`/openc2/command`)
        .send(COMMAND)
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200)
        .then(response => {
          expect(response.body).toEqual(RESPONSE);
          done();
        })
        .catch(error => {
          done(error);
        });
    }, 300);
    it(`Should response 200 and a command response when POST request is performed over /openc2/commands and an array is received`, done => {
      oc2Route.once('command', (command, response) => {
        expect(command).toEqual(COMMAND);
        response(undefined, [RESPONSE]);
      });
      request(app)
        .post(`/openc2/command`)
        .send(COMMAND)
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200)
        .then(response => {
          expect(response.body).toEqual([RESPONSE]);
          done();
        })
        .catch(error => {
          done(error);
        });
    }, 300);
    it(`Should response 500 and an error when POST request is performed over /openc2/commands and not response is done`, done => {
      const ownCommand = {
        ...COMMAND,
        content: {
          ...COMMAND.content,
          args: {
            duration: 250,
          },
        },
      };
      oc2Route.once('command', (command, response) => {
        expect(command).toEqual(ownCommand);
      });
      request(app)
        .post(`/openc2/command`)
        .send(ownCommand)
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .expect(500)
        .then(response => {
          expect(response.body.status).toEqual(500);
          expect(response.body.code).toEqual('CrashError');
          expect(response.body.title).toEqual('Internal Server Error');
          expect(response.body.detail).toEqual('Internal Server Error');
          expect(response.body.source).toEqual({
            pointer: '/openc2/command',
            parameter: {
              body: {
                ...COMMAND,
                content: {
                  ...COMMAND.content,
                  args: {
                    duration: 250,
                  },
                },
              },
              query: {},
            },
          });
          done();
        })
        .catch(error => {
          done(error);
        });
    }, 300);
    it(`Should response 500 and an error when POST request is performed over /openc2/commands and an Error is response`, done => {
      const ownCommand = {
        ...COMMAND,
        content: {
          ...COMMAND.content,
          args: {
            duration: 250,
          },
        },
      };
      oc2Route.once('command', (command, response) => {
        expect(command).toEqual(ownCommand);
        response(new Crash('otherError'));
      });
      request(app)
        .post(`/openc2/command`)
        .send(ownCommand)
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .expect(500)
        .then(response => {
          expect(response.body.status).toEqual(500);
          expect(response.body.code).toEqual('CrashError');
          expect(response.body.title).toEqual('Internal Server Error');
          expect(response.body.detail).toEqual('Internal Server Error');
          expect(response.body.source).toEqual({
            pointer: '/openc2/command',
            parameter: {
              body: {
                ...COMMAND,
                content: {
                  ...COMMAND.content,
                  args: {
                    duration: 250,
                  },
                },
              },
              query: {},
            },
          });
          done();
        })
        .catch(error => {
          done(error);
        });
    }, 300);
    it(`Should response 400 and an error when POST request is performed over /openc2/commands and BadRequest is returned`, done => {
      const ownCommand = {
        ...COMMAND,
        content: {
          ...COMMAND.content,
          args: {
            duration: 250,
          },
        },
      };
      const ownResponse = {
        ...RESPONSE,
        content: {
          ...RESPONSE.content,
          status: Control.StatusCode.BadRequest,
        },
        status: Control.StatusCode.BadRequest,
      };
      oc2Route.once('command', (command, response) => {
        expect(command).toEqual(ownCommand);
        response(undefined, ownResponse);
      });
      request(app)
        .post(`/openc2/command`)
        .send(ownCommand)
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .expect(400)
        .then(response => {
          expect(response.body.status).toEqual(400);
          expect(response.body.code).toEqual('HTTP');
          expect(response.body.title).toEqual('Bad Request');
          expect(response.body.detail).toEqual('Bad OC2 Request');
          expect(response.body.meta).toEqual(ownResponse);
          done();
        })
        .catch(error => {
          done(error);
        });
    }, 300);
    it(`Should response 401 and an error when POST request is performed over /openc2/commands and Unauthorized is returned`, done => {
      const ownCommand = {
        ...COMMAND,
        content: {
          ...COMMAND.content,
          args: {
            duration: 250,
          },
        },
      };
      const ownResponse = {
        ...RESPONSE,
        content: {
          ...RESPONSE.content,
          status: Control.StatusCode.Unauthorized,
        },
        status: Control.StatusCode.Unauthorized,
      };
      oc2Route.once('command', (command, response) => {
        expect(command).toEqual(ownCommand);
        response(undefined, ownResponse);
      });
      request(app)
        .post(`/openc2/command`)
        .send(ownCommand)
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .expect(401)
        .then(response => {
          expect(response.body.status).toEqual(401);
          expect(response.body.code).toEqual('HTTP');
          expect(response.body.title).toEqual('Unauthorized');
          expect(response.body.detail).toEqual('Unauthorized OC2 Request');
          expect(response.body.meta).toEqual(ownResponse);
          done();
        })
        .catch(error => {
          done(error);
        });
    }, 300);
    it(`Should response 403 and an error when POST request is performed over /openc2/commands and Forbidden is returned`, done => {
      const ownCommand = {
        ...COMMAND,
        content: {
          ...COMMAND.content,
          args: {
            duration: 250,
          },
        },
      };
      const ownResponse = {
        ...RESPONSE,
        content: {
          ...RESPONSE.content,
          status: Control.StatusCode.Forbidden,
        },
        status: Control.StatusCode.Forbidden,
      };
      oc2Route.once('command', (command, response) => {
        expect(command).toEqual(ownCommand);
        response(undefined, ownResponse);
      });
      request(app)
        .post(`/openc2/command`)
        .send(ownCommand)
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .expect(403)
        .then(response => {
          expect(response.body.status).toEqual(403);
          expect(response.body.code).toEqual('HTTP');
          expect(response.body.title).toEqual('Forbidden');
          expect(response.body.detail).toEqual('Forbidden OC2 Request');
          expect(response.body.meta).toEqual(ownResponse);
          done();
        })
        .catch(error => {
          done(error);
        });
    }, 300);
    it(`Should response 404 and an error when POST request is performed over /openc2/commands and NotFound is returned`, done => {
      const ownCommand = {
        ...COMMAND,
        content: {
          ...COMMAND.content,
          args: {
            duration: 250,
          },
        },
      };
      const ownResponse = {
        ...RESPONSE,
        content: {
          ...RESPONSE.content,
          status: Control.StatusCode.NotFound,
        },
        status: Control.StatusCode.NotFound,
      };
      oc2Route.once('command', (command, response) => {
        expect(command).toEqual(ownCommand);
        response(undefined, ownResponse);
      });
      request(app)
        .post(`/openc2/command`)
        .send(ownCommand)
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .expect(404)
        .then(response => {
          expect(response.body.status).toEqual(404);
          expect(response.body.code).toEqual('HTTP');
          expect(response.body.title).toEqual('Not Found');
          expect(response.body.detail).toEqual('Not Found OC2 Request');
          expect(response.body.meta).toEqual(ownResponse);
          done();
        })
        .catch(error => {
          done(error);
        });
    }, 300);
    it(`Should response 501 and an error when POST request is performed over /openc2/commands and NotImplemented is returned`, done => {
      const ownCommand = {
        ...COMMAND,
        content: {
          ...COMMAND.content,
          args: {
            duration: 250,
          },
        },
      };
      const ownResponse = {
        ...RESPONSE,
        content: {
          ...RESPONSE.content,
          status: Control.StatusCode.NotImplemented,
        },
        status: Control.StatusCode.NotImplemented,
      };
      oc2Route.once('command', (command, response) => {
        expect(command).toEqual(ownCommand);
        response(undefined, ownResponse);
      });
      request(app)
        .post(`/openc2/command`)
        .send(ownCommand)
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .expect(501)
        .then(response => {
          expect(response.body.status).toEqual(501);
          expect(response.body.code).toEqual('HTTP');
          expect(response.body.title).toEqual('Not Implemented');
          expect(response.body.detail).toEqual('Not Implemented OC2 Request');
          expect(response.body.meta).toEqual(ownResponse);
          done();
        })
        .catch(error => {
          done(error);
        });
    }, 300);
    it(`Should response 503 and an error when POST request is performed over /openc2/commands and ServiceUnavailable is returned`, done => {
      const ownCommand = {
        ...COMMAND,
        content: {
          ...COMMAND.content,
          args: {
            duration: 250,
          },
        },
      };
      const ownResponse = {
        ...RESPONSE,
        content: {
          ...RESPONSE.content,
          status: Control.StatusCode.ServiceUnavailable,
        },
        status: Control.StatusCode.ServiceUnavailable,
      };
      oc2Route.once('command', (command, response) => {
        expect(command).toEqual(ownCommand);
        response(undefined, ownResponse);
      });
      request(app)
        .post(`/openc2/command`)
        .send(ownCommand)
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .expect(503)
        .then(response => {
          expect(response.body.status).toEqual(503);
          expect(response.body.code).toEqual('HTTP');
          expect(response.body.title).toEqual('Service Unavailable');
          expect(response.body.detail).toEqual('Service Unavailable OC2 Request');
          expect(response.body.meta).toEqual(ownResponse);
          done();
        })
        .catch(error => {
          done(error);
        });
    }, 300);
    it(`Should response 500 and an error when POST request is performed over /openc2/commands and unknown code is received`, done => {
      const ownCommand = {
        ...COMMAND,
        content: {
          ...COMMAND.content,
          args: {
            duration: 250,
          },
        },
      };
      const ownResponse = {
        ...RESPONSE,
        content: {
          ...RESPONSE.content,
          status: 1000,
        },
        status: 1000,
      };
      oc2Route.once('command', (command, response) => {
        expect(command).toEqual(ownCommand);
        response(undefined, ownResponse);
      });
      request(app)
        .post(`/openc2/command`)
        .send(ownCommand)
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .expect(500)
        .then(response => {
          expect(response.body.status).toEqual(500);
          expect(response.body.code).toEqual('HTTP');
          expect(response.body.title).toEqual('Internal Server Error');
          expect(response.body.detail).toEqual('Unknown OC2 response status code');
          expect(response.body.meta).toEqual(ownResponse);
          done();
        })
        .catch(error => {
          done(error);
        });
    }, 300);
  });
});
