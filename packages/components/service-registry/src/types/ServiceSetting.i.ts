import { CustomSetting } from './CustomSetting.t';
import { ServiceRegistryOptions } from './ServiceRegistrySettings.i';

/**
 * Service setting interface
 * Merge in the object the service registry settings and the custom settings.
 */
export interface ServiceSetting<
  CustomSettings extends Record<string, CustomSetting> = Record<string, CustomSetting>,
> extends ServiceRegistryOptions {
  /** Custom settings */
  custom: CustomSettings;
}
