/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
// *************************************************************************************************
import { Crash, Multi } from '@mdf.js/crash';
import { v4 } from 'uuid';
import { DoorKeeper } from '.';
// #endregion
// *************************************************************************************************
// #region Arrange
const dk = new DoorKeeper({ $data: true, strict: false });
const FAKE_UUID = '213d630f-7517-4370-baae-d0a5862799f5';

const entity = {
  $schema: 'http://json-schema.org/draft-07/schema',
  $id: 'other.schema.json',
  title: 'Entity ID',
  description: 'HW or SW Netin entity ID',
  type: 'string',
  format: 'uuid',
  errorMessage: 'Entity must be a valid RFC4122 UUID',
};

const schema1 = {
  $schema: 'http://json-schema.org/draft-07/schema',
  $id: 'schema1.schema.json',
  title: 'Schema 1',
  description: 'Schema 1',
  type: 'number',
  errorMessage: 'Schema 1 must be a number',
};
const schema2 = {
  $schema: 'http://json-schema.org/draft-07/schema',
  $id: 'schema2.schema.json',
  title: 'Schema 2',
  description: 'Schema 2',
  type: 'number',
  errorMessage: 'Schema 2 must be a number',
};
const schema3 = {
  $schema: 'http://json-schema.org/draft-07/schema',
  $id: 'schema3.schema.json',
  title: 'Schema 3',
  description: 'Schema 3',
  type: 'number',
  errorMessage: 'Schema 3 must be a number',
};
const schema4 = {
  $schema: 'http://json-schema.org/draft-07/schema',
  $id: 'schema4.schema.json',
  title: 'Schema 4',
  description: 'Schema 4',
  type: 'number',
  errorMessage: 'Schema 4 must be a number',
};
const schemaDeep = {
  $schema: 'http://json-schema.org/draft-07/schema',
  $id: 'schemaDeep.schema.json',
  title: 'Schema Deep',
  description: 'Schema Deep',
  type: 'object',
  properties: {
    schema3: { $ref: 'schema3.schema.json#' },
    schema4: { $ref: 'schema4.schema.json#' },
  },
  required: ['schema3', 'schema4'],
  additionalProperties: false,
};
const schema5 = {
  $schema: 'http://json-schema.org/draft-07/schema',
  $id: 'schema5.schema.json',
  title: 'Schema 5',
  description: 'Schema 5',
  type: 'object',
  properties: {
    schema1: { $ref: 'schema1.schema.json#' },
    schema2: { $ref: 'schema2.schema.json#' },
    schemaDeep: { $ref: 'schemaDeep.schema.json#' },
  },
  required: ['schema1', 'schema2', 'schemaDeep'],
  additionalProperties: false,
};

const schema6 = {
  $schema: 'http://json-schema.org/draft-07/schema',
  $id: 'schema6.schema.json',
  title: 'Schema ',
  description: 'Schema 6',
  markdownDescription: 'Schema 6',
  defaultSnippets: [
    {
      label: 'Schema 6',
      description: 'Schema 6',
      body: {
        schema1: 1,
        schema2: 2,
        schema3: 3,
        schema4: 4,
        schema5: {
          schema1: 1,
          schema2: 2,
          schemaDeep: {
            schema3: 3,
            schema4: 4,
          },
        },
      },
    },
  ],
  type: 'object',
  properties: {
    schema1: { $ref: 'schema1.schema.json#' },
    schema2: { $ref: 'schema2.schema.json#' },
    schema3: { $ref: 'schema3.schema.json#' },
    schema4: { $ref: 'schema4.schema.json#' },
    schema5: { $ref: 'schema5.schema.json#' },
  },
  required: ['schema1', 'schema2', 'schema3', 'schema4', 'schema5'],
  additionalProperties: false,
};

const schemas = {
  Schema1: schema1,
  Schema2: schema2,
};
const schemasArray = [schema3, schema4, schemaDeep];

const artifact = {
  id: 'myArtifact',
  processId: FAKE_UUID,
  release: '1.0.1',
  version: '1',
};
const artifactSchema = {
  $schema: 'http://json-schema.org/draft-07/schema',
  $id: 'artifact.schema.json',
  title: 'Artifact',
  description: 'Artifact',
  type: 'object',
  properties: {
    id: { type: 'string' },
    processId: { type: 'string', format: 'uuid' },
    release: { type: 'string' },
    version: { type: 'string' },
  },
  required: ['id', 'processId', 'release', 'version'],
  additionalProperties: false,
};
dk.register('Config.Artifact', artifactSchema);
const result = {
  $schema: 'http://json-schema.org/draft-07/schema',
  $id: 'schema6.schema.json',
  title: 'Schema ',
  description: 'Schema 6',
  markdownDescription: 'Schema 6',
  defaultSnippets: [
    {
      label: 'Schema 6',
      description: 'Schema 6',
      body: {
        schema1: 1,
        schema2: 2,
        schema3: 3,
        schema4: 4,
        schema5: {
          schema1: 1,
          schema2: 2,
          schemaDeep: { schema3: 3, schema4: 4 },
        },
      },
    },
  ],
  type: 'object',
  properties: {
    schema1: {
      title: 'Schema 1',
      description: 'Schema 1',
      type: 'number',
      errorMessage: 'Schema 1 must be a number',
    },
    schema2: {
      title: 'Schema 2',
      description: 'Schema 2',
      type: 'number',
      errorMessage: 'Schema 2 must be a number',
    },
    schema3: {
      title: 'Schema 3',
      description: 'Schema 3',
      type: 'number',
      errorMessage: 'Schema 3 must be a number',
    },
    schema4: {
      title: 'Schema 4',
      description: 'Schema 4',
      type: 'number',
      errorMessage: 'Schema 4 must be a number',
    },
    schema5: {
      title: 'Schema 5',
      description: 'Schema 5',
      type: 'object',
      properties: {
        schema1: {
          title: 'Schema 1',
          description: 'Schema 1',
          type: 'number',
          errorMessage: 'Schema 1 must be a number',
        },
        schema2: {
          title: 'Schema 2',
          description: 'Schema 2',
          type: 'number',
          errorMessage: 'Schema 2 must be a number',
        },
        schemaDeep: {
          title: 'Schema Deep',
          description: 'Schema Deep',
          type: 'object',
          properties: {
            schema3: {
              title: 'Schema 3',
              description: 'Schema 3',
              type: 'number',
              errorMessage: 'Schema 3 must be a number',
            },
            schema4: {
              title: 'Schema 4',
              description: 'Schema 4',
              type: 'number',
              errorMessage: 'Schema 4 must be a number',
            },
          },
          required: ['schema3', 'schema4'],
          additionalProperties: false,
        },
      },
      required: ['schema1', 'schema2', 'schemaDeep'],
      additionalProperties: false,
    },
  },
  required: ['schema1', 'schema2', 'schema3', 'schema4', 'schema5'],
  additionalProperties: false,
};
// #endregion
// *************************************************************************************************
// #region Test Schemas
describe('#DoorKeeper #package', () => {
  describe('#Happy path', () => {
    it(`Should create a valid instances with default config`, () => {
      expect(dk).toBeInstanceOf(DoorKeeper);
      expect(dk.options).toHaveProperty('allErrors', true);
      //@ts-ignore - Test environment
      expect(dk.ajv.getKeyword('markdownDescription')).toBeDefined();
      //@ts-ignore - Test environment
      expect(dk.ajv.getKeyword('defaultSnippets')).toBeDefined();
      const myDK = new DoorKeeper();
      expect(myDK).toBeInstanceOf(DoorKeeper);
      expect(myDK.options).toHaveProperty('allErrors', true);
      //@ts-ignore - Test environment
      const oeo = myDK.ajv.getKeyword('markdownDescription');
      //@ts-ignore - Test environment
      expect(myDK.ajv.getKeyword('markdownDescription')).toBeDefined();
      //@ts-ignore - Test environment
      expect(myDK.ajv.getKeyword('defaultSnippets')).toBeDefined();
    });
    it(`Should register all the schemas properly`, () => {
      const test = () => {
        dk.register(schemasArray);
        dk.register(schemas);
        dk.register('other', entity);
        dk.register('Schema5', schema5);
        dk.register('Schema6', schema6);
        expect(dk.isSchemaRegistered('other')).toBeTruthy();
        expect(dk.isSchemaRegistered('Config.Artifact')).toBeTruthy();
        expect(dk.isSchemaRegistered('Schema1')).toBeTruthy();
        expect(dk.isSchemaRegistered('Schema2')).toBeTruthy();
        expect(dk.isSchemaRegistered('schema3.schema.json#')).toBeTruthy();
        expect(dk.isSchemaRegistered('schema4.schema.json#')).toBeTruthy();
        expect(dk.dereference('Schema6')).toEqual(result);
      };
      expect(test).not.toThrow();
    });
    it(`Should resolve a correct JSON object when try to validate a schema that is in the scope and is CORRECT`, async () => {
      await expect(dk.validate('Config.Artifact', artifact, v4())).resolves.toBe(artifact);
      await expect(dk.validate('Config.Artifact', artifact)).resolves.toBe(artifact);
    });
    it(`Should invoke the callback a correct JSON object when try to validate a schema that is in the scope and is CORRECT`, done => {
      dk.validate('Config.Artifact', artifact, (error, result) => {
        expect(error).toBeUndefined();
        expect(result).toEqual(artifact);
        done();
      });
    });
    it(`Should invoke the callback a correct JSON object when try to validate a schema that is in the scope and is CORRECT using external uuid`, done => {
      dk.validate('Config.Artifact', artifact, v4(), (error, result) => {
        expect(error).toBeUndefined();
        expect(result).toEqual(artifact);
        done();
      });
    });
    it(`Should invoke the callback with an error when try to validate a schema that is in the scope and is INCORRECT`, done => {
      dk.validate('Config.Artifact', {}, (error, result) => {
        expect(error).toBeInstanceOf(Multi);
        expect((error as Multi).message).toEqual('Errors during the schema validation process');
        expect((error as Multi).name).toEqual('ValidationError');
        expect((error as Multi).causes).toBeDefined();
        const causes = (error as Multi).causes as Crash[];
        for (const cause of causes) {
          expect(cause).toBeInstanceOf(Crash);
          expect(cause.name).toEqual('ValidationError');
        }
        const trace = (error as Multi).trace();
        expect(trace).toEqual([
          "ValidationError: must have required property 'id' - Value: [{}]",
          "ValidationError: must have required property 'processId' - Value: [{}]",
          "ValidationError: must have required property 'release' - Value: [{}]",
          "ValidationError: must have required property 'version' - Value: [{}]",
        ]);
        expect(result).toEqual({});
        done();
      });
    });
    it(`Should invoke the callback with an error when try to validate a schema that is in the scope and is INCORRECT using external uuid`, done => {
      dk.validate('Config.Artifact', {}, v4(), (error, result) => {
        expect(error).toBeInstanceOf(Multi);
        expect((error as Multi).message).toEqual('Errors during the schema validation process');
        expect((error as Multi).name).toEqual('ValidationError');
        expect((error as Multi).causes).toBeDefined();
        const causes = (error as Multi).causes as Crash[];
        for (const cause of causes) {
          expect(cause).toBeInstanceOf(Crash);
          expect(cause.name).toEqual('ValidationError');
        }
        const trace = (error as Multi).trace();
        expect(trace).toEqual([
          "ValidationError: must have required property 'id' - Value: [{}]",
          "ValidationError: must have required property 'processId' - Value: [{}]",
          "ValidationError: must have required property 'release' - Value: [{}]",
          "ValidationError: must have required property 'version' - Value: [{}]",
        ]);
        expect(result).toEqual({});
        done();
      });
    });
    it(`Should resolve a correct JSON object when attempt to validate a schema that is in the scope and is CORRECT`, () => {
      expect(dk.attempt('Config.Artifact', artifact, v4())).toBe(artifact);
      expect(dk.attempt('Config.Artifact', artifact)).toBe(artifact);
    });
    it(`Should return a TRUE value when try to check a schema that is in the scope and is CORRECT`, () => {
      expect(dk.check('Config.Artifact', artifact)).toBeTruthy();
      expect(dk.check('Config.Artifact', artifact, v4())).toBeTruthy();
    });
    it(`Should return a FALSE value when try to check a schema that is in the scope and is INCORRECT`, () => {
      expect(dk.check('Config.Artifact', {})).toBeFalsy();
      expect(dk.check('Config.Artifact', {}, v4())).toBeFalsy();
    });
  });
  describe('#Sad path', () => {
    it(`Should throw with a Crash error when we attempt to register an invalid schema`, done => {
      try {
        const myDK = new DoorKeeper();
        myDK.register('emptySchema', { type: 'value' });
      } catch (error) {
        expect(error).toBeInstanceOf(Crash);
      }
      try {
        const myDK = new DoorKeeper();
        //@ts-ignore - Test environment
        myDK.register(2, { type: 'value' });
      } catch (error) {
        expect(error).toBeInstanceOf(Crash);
        expect((error as Crash).message).toEqual(
          'Invalid parameters, no schema will be registered'
        );
        done();
      }
    });
    it(`Should throw with a Crash error when we attempt to register an schema a ajv throw`, done => {
      try {
        const myDK = new DoorKeeper();
        //@ts-ignore - Test environment
        jest.spyOn(myDK.ajv, 'addSchema').mockImplementation(() => {
          throw new Error('Error');
        });
        myDK.register('emptySchema', { type: 'value' });
      } catch (error) {
        expect(error).toBeInstanceOf(Crash);
        expect((error as Crash).message).toEqual(
          'Error adding the schema: [emptySchema] - error: [Error]'
        );
        expect((error as Crash).cause).toBeInstanceOf(Crash);
        expect((error as Crash).cause?.message).toEqual('Error');
        done();
      }
    });
    it(`Should throw with a Crash error when we attempt to compile an schema a ajv throw`, done => {
      try {
        const myDK = new DoorKeeper();
        //@ts-ignore - Test environment
        jest.spyOn(myDK.ajv, 'compile').mockImplementation(() => {
          throw new Error('Error');
        });
        myDK.register([{ type: 'value' }]);
      } catch (error) {
        expect(error).toBeInstanceOf(Crash);
        expect((error as Crash).message).toEqual(
          'Error adding the schema: [{"type":"value"}] - error: [Error]'
        );
        expect((error as Crash).cause).toBeInstanceOf(Crash);
        expect((error as Crash).cause?.message).toEqual('Error');
        done();
      }
    });
    it(`Should throw with a Crash error when we attempt to compile an invalid schema`, () => {
      const test = () => {
        const myDK = new DoorKeeper();
        myDK.register([{ type: 'value' }]);
      };
      expect(test).toThrow();
    });
    it(`Should reject with a Crash error when we try to validate a schema that is not in the scope`, async () => {
      try {
        await dk.validate('noRealSchema', {}, v4());
      } catch (error) {
        expect(error).toBeInstanceOf(Crash);
        expect((error as Crash).message).toEqual(
          'noRealSchema is not registered in the collection.'
        );
        expect((error as Crash).name).toEqual('ValidationError');
        expect((error as Crash).info).toHaveProperty('schema');
      }
    });
    it(`Should call the callback with a Crash error when we try to validate a schema that is not in the scope`, done => {
      const callback = (error?: Crash | Multi, data?: any) => {
        expect(error).toBeInstanceOf(Crash);
        expect((error as Crash).message).toEqual(
          'noRealSchema is not registered in the collection.'
        );
        expect((error as Crash).name).toEqual('ValidationError');
        expect((error as Crash).info).toHaveProperty('schema');
        done();
      };
      const myDK = new DoorKeeper();
      myDK.register(schemas);
      myDK.validate('noRealSchema', {}, v4(), callback);
    });
    it(`Should call the callback with a Crash error when a unexpected problems occurs with ajv validation in a validation process`, () => {
      const callback = (error?: Crash | Multi, data?: any) => {
        expect(error).toBeInstanceOf(Crash);
        expect((error as Crash).message).toEqual(
          'Unexpected error in JSON schema validation process'
        );
        expect((error as Crash).name).toEqual('ValidationError');
        expect((error as Crash).info).toHaveProperty('schema');
        expect((error as Crash).info).toHaveProperty('data');
      };
      const myDK = new DoorKeeper();
      myDK.register(schemas);
      const validator = (function () {
        const validator = function () {
          return false;
        };
        validator.errors = false;
        return validator;
      })();
      //@ts-ignore - Test environment
      jest.spyOn(myDK.ajv, 'getSchema').mockReturnValue(validator);
      myDK.validate('Schema1', {}, v4(), callback);
    });
    it(`Should call the callback with a Crash error when a unexpected problems occurs with ajv validation in an attempt process`, done => {
      const myDK = new DoorKeeper();
      myDK.register(schemas);
      const validator = (function () {
        const validator = function () {
          return false;
        };
        validator.errors = false;
        return validator;
      })();
      //@ts-ignore - Test environment
      jest.spyOn(myDK.ajv, 'getSchema').mockReturnValue(validator);
      try {
        myDK.attempt('Schema1', {}, v4());
      } catch (error) {
        expect(error).toBeInstanceOf(Crash);
        expect((error as Crash).message).toEqual(
          'Unexpected error in JSON schema validation process'
        );
        expect((error as Crash).name).toEqual('ValidationError');
        expect((error as Crash).info).toHaveProperty('schema');
        expect((error as Crash).info).toHaveProperty('data');
        done();
      }
    });
    it(`Should throw with a Crash error when we attempt to validate a schema that is not in the scope`, done => {
      try {
        dk.attempt('noRealSchema', {}, v4());
      } catch (error) {
        expect(error).toBeInstanceOf(Crash);
        expect((error as Crash).message).toEqual(
          'noRealSchema is not registered in the collection.'
        );
        expect((error as Crash).name).toEqual('ValidationError');
        expect((error as Crash).info).toHaveProperty('schema');
        done();
      }
    });
    it(`Should reject the validation process when try to validate a schema that is in the scope but is INCORRECT`, async () => {
      try {
        await dk.validate('Config.Artifact', { numHosts: 'badProperty' }, v4());
        throw new Error('Should not be here');
      } catch (error) {
        expect(error).toBeInstanceOf(Multi);
        expect((error as Multi).message).toEqual('Errors during the schema validation process');
        expect((error as Multi).name).toEqual('ValidationError');
        expect((error as Multi).causes).toBeDefined();
        const causes = (error as Multi).causes as Crash[];
        for (const cause of causes) {
          expect(cause).toBeInstanceOf(Crash);
          expect(cause.name).toEqual('ValidationError');
        }
        const trace = (error as Multi).trace();
        expect(trace).toEqual([
          'ValidationError: must have required property \'id\' - Value: [{"numHosts":"badProperty"}]',
          'ValidationError: must have required property \'processId\' - Value: [{"numHosts":"badProperty"}]',
          'ValidationError: must have required property \'release\' - Value: [{"numHosts":"badProperty"}]',
          'ValidationError: must have required property \'version\' - Value: [{"numHosts":"badProperty"}]',
          'ValidationError: must NOT have additional properties - Property: [numHosts] - Value: [{"numHosts":"badProperty"}]',
        ]);
      }
    });
    it(`Should throw the validation process when attempt to validate a schema that is in the scope but is INCORRECT`, done => {
      try {
        dk.attempt(
          'Config.Artifact',
          {
            id: 4,
            release: { test: 3 },
            version: Symbol('my'),
            processId: undefined,
            numHosts: 'badProperty',
          },
          v4()
        );
        throw new Error('Should not be here');
      } catch (error) {
        expect(error).toBeInstanceOf(Multi);
        expect((error as Multi).message).toEqual('Errors during the schema validation process');
        expect((error as Multi).name).toEqual('ValidationError');
        expect((error as Multi).causes).toBeDefined();
        done();
      }
    });
  });
});
// #endregion
