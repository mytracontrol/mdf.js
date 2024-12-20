/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
import { BoomHelpers, Crash, Multi } from '@mdf.js/crash';
import { NextFunction, Request, RequestHandler, Response } from 'express';
import { merge } from 'lodash';
import multer, { FileFilterCallback, MulterError, Options, StorageEngine } from 'multer';

const MEMORY_STORAGE = multer.memoryStorage();

export type MulterLimits = Options['limits'];

// *************************************************************************************************
// #region Multer limits and configuration default values
/** Max field name size (in bytes) */
const DEFAULT_CONFIG_API_MAX_FORM_FIELD_SIZE = 100;
/** Max field value size (in bytes) */
const DEFAULT_CONFIG_API_MAX_FIELD_SIZE = 1048576;
/** Max number of non-file fields */
const DEFAULT_CONFIG_API_MAX_FIELDS = 100;
/** For multipart forms, the max file size (in bytes)*/
const DEFAULT_CONFIG_API_MAX_UPLOAD_FILE_SIZE = 1048576 * 1;
/** For multipart forms, the max number of file fields */
const DEFAULT_CONFIG_API_MAX_FILES = 10;
/** For multipart forms, the max number of parts (fields + files) */
const DEFAULT_CONFIG_API_MAX_PARTS = 100;
/** For multipart forms, the max number of header key=>value pairs to parse */
const DEFAULT_CONFIG_API_MAX_HEADERS = 2000;
// #endregion
/**
 * Multer middleware wrapping for multipart/from-data
 * @remarks WARNING:
 * Make sure that you always handle the files that a user uploads. Never add multer as a global
 * middleware since a malicious user could upload files to a route that you didn't anticipate. Only
 * use this function on routes where you are handling the uploaded files.
 */
export class Multer {
  /** Allowed mime types allowed for this multer instance */
  private readonly allowedMimeTypes: string[] = [];
  /** Instance of multer */
  private readonly instance: multer.Multer;
  /**
   * Return a new instance of the multipart/form-data middleware
   * @param storage - storage engine used for this middleware
   * @param allowedMineTypes - Allowed mime types allowed for this multer instance
   * @param limits - Limits for the middleware
   */
  static Instance(
    storage?: StorageEngine,
    allowedMineTypes?: string | string[],
    limits?: MulterLimits
  ): Multer {
    return new Multer(storage, allowedMineTypes, limits);
  }
  /**
   * Return a new instance of the multipart/form-data middleware that accepts a single file with the
   * name fieldName. The single file will be stored in req.file
   * @param fieldName - name of the file field
   * @param storage - storage engine used for this middleware
   * @param allowedMineTypes - Allowed mime types allowed for this multer instance
   * @param limits - Limits for the middleware
   */
  static SingleHandler(
    fieldName: string,
    storage?: StorageEngine,
    allowedMineTypes?: string | string[],
    limits?: MulterLimits
  ): RequestHandler {
    return new Multer(storage, allowedMineTypes, limits).single(fieldName);
  }
  /**
   * Return a new instance of the multipart/form-data middleware that accepts an array of files, all
   * with the name fieldName. Optionally error out if more than maxCount files are uploaded. The
   * array of files will be stored in req.files
   * @param fieldName - name of the file field
   * @param maxCount - maximum number of files
   * @param storage - storage engine used for this middleware
   * @param allowedMineTypes - Allowed mime types allowed for this multer instance
   * @param limits - Limits for the middleware
   */
  static ArrayHandler(
    fieldName: string,
    maxCount?: number,
    storage?: StorageEngine,
    allowedMineTypes?: string | string[],
    limits?: MulterLimits
  ): RequestHandler {
    return new Multer(storage, allowedMineTypes, limits).array(fieldName, maxCount);
  }
  /**
   * Return a new instance of the multipart/form-data middleware that accepts a mix of files,
   * specified by fields. An object with arrays of files will be stored in req.files.
   * @param fields - array of entries
   *
   * @example
   *
   * ```
   * [ { name: 'avatar', maxCount: 1 }, { name: 'gallery', maxCount: 8 }]
   * ```
   * @param storage - storage engine used for this middleware
   * @param allowedMineTypes - Allowed mime types allowed for this multer instance
   * @param limits - Limits for the middleware
   */
  static FieldsHandler(
    fields: readonly multer.Field[],
    storage?: StorageEngine,
    allowedMineTypes?: string | string[],
    limits?: MulterLimits
  ): RequestHandler {
    return new Multer(storage, allowedMineTypes, limits).fields(fields);
  }
  /**
   * Return a new instance of the multipart/form-data middleware that accepts only text fields. If
   * any file upload is made, error with code "Unexpected field" will be issued.
   * @param storage - storage engine used for this middleware
   * @param allowedMineTypes - Allowed mime types allowed for this multer instance
   * @param limits - Limits for the middleware
   */
  static NoneHandler(
    storage?: StorageEngine,
    allowedMineTypes?: string | string[],
    limits?: MulterLimits
  ): RequestHandler {
    return new Multer(storage, allowedMineTypes, limits).none();
  }
  /**
   * Return a new instance of the multipart/form-data middleware that accepts all files that comes
   * over the wire. An array of files will be stored in req.files.
   * @param storage - storage engine used for this middleware
   * @param allowedMineTypes - Allowed mime types allowed for this multer instance
   * @param limits - Limits for the middleware
   */
  static AnyHandler(
    storage?: StorageEngine,
    allowedMineTypes?: string | string[],
    limits?: MulterLimits
  ): RequestHandler {
    return new Multer(storage, allowedMineTypes, limits).any();
  }
  /**
   * Return a new instance of the multipart/form-data middleware
   * @param storage - storage engine used for this middleware
   * @param allowedMineTypes - Allowed mime types allowed for this multer instance
   * @param limits - Limits for the middleware
   */
  private constructor(
    storage: StorageEngine = MEMORY_STORAGE,
    allowedMineTypes: string | string[] = [],
    limits: MulterLimits
  ) {
    if (typeof allowedMineTypes === 'string' || Array.isArray(allowedMineTypes)) {
      this.allowedMimeTypes =
        typeof allowedMineTypes === 'string' ? [allowedMineTypes] : allowedMineTypes;
    }
    this.instance = multer({
      storage,
      limits: merge(limits, {
        fieldNameSize: DEFAULT_CONFIG_API_MAX_FORM_FIELD_SIZE,
        fieldSize: DEFAULT_CONFIG_API_MAX_FIELD_SIZE,
        fields: DEFAULT_CONFIG_API_MAX_FIELDS,
        fileSize: DEFAULT_CONFIG_API_MAX_UPLOAD_FILE_SIZE,
        files: DEFAULT_CONFIG_API_MAX_FILES,
        parts: DEFAULT_CONFIG_API_MAX_PARTS,
        headerPairs: DEFAULT_CONFIG_API_MAX_HEADERS,
      }),
      preservePath: true,
      fileFilter: this.fileFilter,
    });
  }
  /**
   * Perform the filtering of the request based on the attached file properties and the request
   * @param request - HTTP request express object
   * @param file - file information
   * @param callback - callback function to return the final decision
   */
  private readonly fileFilter = (
    request: Request,
    file: Express.Multer.File,
    callback: FileFilterCallback
  ): void => {
    if (this.allowedMimeTypes.length === 0 || this.allowedMimeTypes.includes(file.mimetype)) {
      callback(null, true);
    } else {
      callback(
        BoomHelpers.unsupportedMediaType(
          `Unsupported media type: [${file.mimetype}]. Supported types: [${this.allowedMimeTypes}]`,
          request.uuid,
          {
            source: {
              pointer: request.path,
              parameter: { body: request.body, query: request.query },
            },
          }
        )
      );
    }
  };
  /**
   * Accept a single file with the name fieldName. The single file will be stored in req.file
   * @param fieldName - name of the file
   */
  public single(fieldName: string): RequestHandler {
    return this.multerWrap(this.instance.single(fieldName));
  }
  /**
   * Accept an array of files, all with the name fieldName. Optionally error out if more than
   * maxCount files are uploaded. The array of files will be stored in req.files
   * @param fieldName - name of file
   * @param maxCount - maximum number of files
   */
  public array(fieldName: string, maxCount?: number): RequestHandler {
    return this.multerWrap(this.instance.array(fieldName, maxCount));
  }
  /**
   * Accept a mix of files, specified by fields. An object with arrays of files will be stored in
   * req.files.
   * @param fields - array of entries
   *
   * @example
   *
   * ```
   * [ { name: 'avatar', maxCount: 1 }, { name: 'gallery', maxCount: 8 }]
   * ```
   */
  public fields(fields: readonly multer.Field[]): RequestHandler {
    return this.multerWrap(this.instance.fields(fields));
  }
  /**
   * Accept only text fields. If any file upload is made, error with code "Unexpected field" will
   * be issued.
   */
  public none(): RequestHandler {
    return this.multerWrap(this.instance.none());
  }
  /**
   * Accepts all files that comes over the wire. An array of files will be stored in req.files.
   */
  public any(): RequestHandler {
    return this.multerWrap(this.instance.any());
  }
  /**
   * Wrap the multer middleware functions for error management
   * @param middleware - multer middleware handled function to wrap
   */
  private multerWrap(
    middleware: (request: Request, response: Response, next: NextFunction) => void
  ): RequestHandler {
    return (request: Request, response: Response, next: NextFunction) => {
      middleware(request, response, (error?: Error | MulterError | any) => {
        if (error instanceof MulterError) {
          const validationError = new Multi(`Errors during form processing`, request.uuid, {
            name: 'ValidationError',
          });
          const formFormatError = new Crash(`Form error: ${error.message}`, request.uuid, {
            name: 'ValidationError',
          });
          validationError.push(formFormatError);
          next(validationError);
        } else if (error) {
          next(error);
        } else {
          next();
        }
      });
    };
  }
}

