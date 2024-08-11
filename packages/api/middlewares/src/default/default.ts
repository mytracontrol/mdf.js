/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { BoomHelpers, Links } from '@mdf.js/crash';
import { NextFunction, Request, RequestHandler, Response } from 'express';

export class Default {
  /** Request traceability middleware handler */
  public static handler(links?: Links): RequestHandler {
    return (req: Request, res: Response, next: NextFunction): void => {
      const baseRequestUrl = `${req.protocol}://${req.get('host')}`;
      const formattedLinks = Default.FormatLinks(baseRequestUrl, links);
      next(
        BoomHelpers.notFound('Not Found', req.uuid, {
          source: {
            pointer: req.path,
            parameter: { body: req.body, query: req.query },
          },
          links: formattedLinks,
        })
      );
    };
  }
  /**
   * Format the links to be used in the default handler
   * @param baseRequestUrl - base url where the observability is served
   * @param links - list of links to be formatted
   * @returns
   */
  public static FormatLinks(baseRequestUrl: string, links: Links = {}): Links {
    const formattedLinks: Links = {};
    if (links) {
      for (const [contextKey, firstLevel] of Object.entries(links)) {
        if (typeof firstLevel === 'string') {
          formattedLinks[contextKey] = `${baseRequestUrl}${firstLevel}`;
        } else {
          const formattedContextLinks: { [link: string]: string } = {};
          for (const [innerContextKey, secondLevel] of Object.entries(firstLevel)) {
            formattedContextLinks[innerContextKey] = `${baseRequestUrl}${secondLevel}`;
          }
          formattedLinks[contextKey] = formattedContextLinks;
        }
      }
    }
    return formattedLinks;
  }
}
