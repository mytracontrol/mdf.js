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

import { Plugs } from '@mdf.js/firehose';
import { Redis } from '@mdf.js/redis-provider';
import { Base } from './Base';

export class Sequence extends Base implements Plugs.Source.Sequence {
  /**
   * Create a new instance of this class
   * @param provider - Redis provider used by this source plug
   * @param streamId - Stream identification from where data will be consumed
   */
  constructor(provider: Redis.Provider, streamId: string) {
    super(provider, streamId);
  }
  /**
   * Perform the ingestion of new data
   * @param size - maximum number of jobs that could be ingested from the source
   * @returns
   */
  public async ingestData(
    size: number
  ): Promise<Plugs.Source.JobObject | Plugs.Source.JobObject[]> {
    const result = await this.repository.getJobs(this.streamId, this.streamEntryId, size);
    this.streamEntryId = result[result.length - 1].jobId;
    return result;
  }
}
