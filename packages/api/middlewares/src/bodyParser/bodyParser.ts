/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 * Note: All information contained herein is, and remains the property of Netin System S.L. and its
 * suppliers, if any. The intellectual and technical concepts contained herein are property of
 * Netin System S.L. and its suppliers and may be covered by European and Foreign patents, patents
 * in process, and are protected by trade secret or copyright.
 *
 * Dissemination of this information or the reproduction of this material is strictly forbidden
 * unless prior written permission is obtained from Netin System S.L.
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
