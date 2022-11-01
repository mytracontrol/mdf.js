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

import { BoomHelpers, Links } from '@mdf/crash';
import { NextFunction, Request, RequestHandler, Response } from 'express';

export class Default {
  /** Request traceability middleware handler */
  public static handler(links?: Links): RequestHandler {
    return (req: Request, res: Response, next: NextFunction): void => {
      const baseRequestUrl = `${req.protocol}://${req.get('host')}`;
      let formattedLinks: Links | undefined;
      if (links) {
        formattedLinks = {};
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
}
