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

import { Counter, Gauge, Histogram } from '@mdf.js/metrics-service';

/** Metric types */
export type MetricInstances = {
  api_all_job_processed_total: Counter<string>;
  api_all_errors_job_processing_total: Counter<string>;
  api_all_job_in_processing_total: Gauge<string>;
  api_publishing_job_duration_milliseconds: Histogram<string>;
};
