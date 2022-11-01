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

import { Crash } from '@mdf.js/crash';
import { Plugs } from '@mdf.js/firehose';
import { Redis } from '@mdf.js/redis-provider';

/**
 * Information about the XREAD command response format for NetinDS jobs.
 * xread('BLOCK', 0, 'COUNT', 2, 'STREAMS', 'alarms.uplink'. 'device.uplink', '0')
 *        0) 0) "alarms.uplink"
 *           1) 0) 0) 1526984818136-0
 *                 1)  0) "alarm"
 *                     1) "'{"schemaVersion":"1.0.0","templateId":"myTemplate","id":"213d630..."
 *              1) 0) 1526999352406-0
 *                 1)  0) "alarm"
 *                     1) "'{"schemaVersion":"1.0.0","templateId":"myTemplate","id":"213d630..."
 *        1) 0) "devices.uplink"
 *           1) 0) 0) 1526985676425-0
 *                 1)  0) "device"
 *                     1) "{"deviceId":"213d630f-7517-4370-baae-d0a5862799f5","templateId":..."
 *              1) 0) 1526985685298-0
 *                 1)  0) "device"
 *                     1) "{"deviceId":"213d630f-7517-4370-baae-d0a5862799f5","templateId":..."
 * result[0][0] => 'alarms.uplink'
 * result[0][1][0][0] => 1526984818136-0
 * result[0][1][0][1][0] => 'alarm'
 * result[0][1][0][1][1] => '{"schemaVersion":"1.0.0","templateId":"myTemplate","id":"213d...'
 */
export class SourceRepository<Type extends string = string, Data = any> {
  /** Provider used by this repository */
  private readonly provider: Redis.Provider;
  /**
   * Create an instance of a source repository
   * @param provider - Redis provider used by this repository
   */
  constructor(provider: Redis.Provider) {
    this.provider = provider;
  }
  /**
   * Wrapped version of xread command from redis
   * @param streamId - stream identifier from where the data will be read
   * @param streamEntryId - entry index from where the data will be read
   * @param count - number of entries to be read
   * @returns
   */
  private async XReadWrapper(
    streamId: string,
    streamEntryId: string,
    count = 1
  ): Promise<[id: string, fields: string[]][]> {
    return this.validateReadResult(
      await this.provider.client.xread(
        'COUNT',
        count,
        'BLOCK',
        0,
        'STREAMS',
        streamId,
        streamEntryId
      ),
      streamId
    );
  }
  /**
   * Checks if the result of the xread command is valid
   * @param result - result of the xread command
   * @param streamId - stream identifier from where the data has been read
   * @returns
   */
  private validateReadResult(
    result: [key: string, items: [id: string, fields: string[]][]][] | null,
    streamId: string
  ): [id: string, fields: string[]][] {
    if (result === null) {
      throw new Crash(
        `No data found in stream, XREAD command return a null value`,
        this.provider.componentId
      );
    }
    if (result.length === 0) {
      throw new Crash(
        `No data found in stream, XREAD command return an empty array`,
        this.provider.componentId
      );
    }
    if (result[0][0] !== streamId) {
      throw new Crash(
        `Received data from stream ${result[0][0]} instead of ${streamId}`,
        this.provider.componentId
      );
    }
    return result[0][1];
  }
  /**
   * Transform entries read from the stream into jobs
   * @param entries - entries to be transformed into jobs
   * @returns
   */
  private createJobsFromEntries(
    entries: [id: string, fields: string[]][]
  ): Plugs.Source.JobObject<Type, Data>[] {
    return entries.map(this.createJobFromEntry);
  }
  /**
   * Create a valid job from a stream entry
   * @param entry - entry to be checked
   * @returns
   */
  private createJobFromEntry = (
    entry: [id: string, fields: string[]]
  ): Plugs.Source.JobObject<Type, Data> => {
    let data: Data;
    let type: Type;
    let jobId: string;
    if (typeof entry[0] !== 'string') {
      throw new Crash(
        `Received an invalid entry from stream, the id is not a string`,
        this.provider.componentId,
        { name: 'InvalidEntry' }
      );
    } else {
      jobId = entry[0];
    }
    if (entry.length < 2 || entry[1].length < 2) {
      throw new Crash(
        `Received an invalid entry from stream, the entry does not contain the required fields`,
        this.provider.componentId,
        { name: 'InvalidEntry' }
      );
    } else {
      type = entry[1][0] as Type;
    }
    try {
      data = JSON.parse(entry[1][1]);
    } catch (rawError) {
      throw new Crash(
        `Received an invalid entry from stream, the data field is not a valid JSON`,
        this.provider.componentId,
        { name: 'InvalidEntry', cause: Crash.from(rawError) }
      );
    }
    return { jobId, type, data };
  };
  /**
   * Delete a job from the stream
   * @param streamId - stream identifier from where the data will be deleted
   * @param jobId - job identifier to be deleted
   */
  public async deleteJob(streamId: string, jobId: string): Promise<string | undefined> {
    try {
      const deletedKeys = await this.provider.client.xdel(streamId, jobId);
      if (deletedKeys === 0) {
        return undefined;
      }
      return jobId;
    } catch (rawError) {
      const error = Crash.from(rawError);
      throw new Crash(`Error deleting job: ${error.message}`, this.provider.componentId, {
        cause: error,
      });
    }
  }
  /**
   * Get new jobs from stream
   * @param streamId - stream identifier from where the data will be read
   * @param streamEntryId - stream entry from where the data will be read
   * @param count - number of entries to be read
   * @returns - Jobs formed from stream entries
   */
  public async getJobs(
    streamId: string,
    streamEntryId: string,
    count = 1
  ): Promise<Plugs.Source.JobObject<Type, Data>[]> {
    try {
      const result = await this.XReadWrapper(streamId, streamEntryId, count);
      return this.createJobsFromEntries(result);
    } catch (rawError) {
      const error = Crash.from(rawError);
      throw new Crash(
        `Error reading new entries from stream: ${error.message}`,
        this.provider.componentId,
        { cause: error }
      );
    }
  }
}
