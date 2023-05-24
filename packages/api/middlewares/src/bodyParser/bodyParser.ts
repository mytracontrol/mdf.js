/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
import {
  json,
  Options,
  OptionsJson,
  OptionsText,
  OptionsUrlencoded,
  raw,
  text,
  urlencoded,
} from 'body-parser';
import { RequestHandler } from 'express';

export class BodyParser {
  /**
   * Returns middleware that only parses json and only looks at requests where the Content-Type
   * header matches the type option.
   * @param options - json body parser options
   * @returns
   */
  public static JSONParserHandler(options?: OptionsJson): RequestHandler {
    return json(options);
  }
  /**
   * Returns middleware that parses all bodies as a Buffer and only looks at requests where the
   * Content-Type header matches the type option.
   * @param options - body parser options
   * @returns
   */
  public static RawParserHandler(options?: Options): RequestHandler {
    return raw(options);
  }
  /**
   * Returns middleware that parses all bodies as a string and only looks at requests where the
   * Content-Type header matches the type option.
   * @param options - text body parser options
   * @returns
   */
  public static TextParserHandler(options?: OptionsText): RequestHandler {
    return text(options);
  }
  /**
   * Returns middleware that only parses urlencoded bodies and only looks at requests where the
   * Content-Type header matches the type option
   * @param options - url encoded body parser options
   * @returns
   */
  public static URLEncodedParserHandler(options?: OptionsUrlencoded): RequestHandler {
    return urlencoded({ ...options, extended: true });
  }
}
