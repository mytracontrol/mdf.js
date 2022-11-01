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
import { Logger } from '@mdf.js/logger';
import { NextFunction, Request, RequestHandler, Response } from 'express';
import { AuditConfig } from './AuditConfig.i';

/**
 * Audit logger function
 * @param options - audit options
 */
function log(options: AuditConfig, logger: Logger): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    const metadata = {
      actor: req.user,
      address: req.socket.remoteAddress,
      area: options.area,
      category: options.category,
      details: options.details,
      body: options.includeBody ? req.body : undefined,
      params: options.includeParams ? req.body : undefined,
      query: options.includeQuery ? req.body : undefined,
    };
    logger.info(
      `${metadata.actor} - ${metadata.area} - ${metadata.category} - ${metadata.details}`,
      req.uuid,
      options.area,
      metadata
    );
    next();
  };
}

export class Audit {
  /** Logger middleware */
  private readonly logger: Logger;
  /**
   * Audit logger middleware instance
   * @param logger - logger instance to be used for audit
   * @returns
   */
  public static instance(logger: Logger): Audit {
    return new Audit(logger);
  }
  /**
   * Request audit logger middleware handler
   * @param logger - logger instance to be used for audit
   * @param auditOptions - audit options
   * @returns
   */
  public static handler(logger: Logger, auditOptions: AuditConfig): RequestHandler {
    return log(auditOptions, logger);
  }
  /**
   * Create a new instance of AuditLogger
   * @param logger - logger instance to be used for audit
   */
  private constructor(logger: Logger) {
    this.logger = logger;
  }
  /**
   * Audit logger function
   * @param options - audit options
   */
  public handler(options: AuditConfig): RequestHandler {
    return log(options, this.logger);
  }
}
