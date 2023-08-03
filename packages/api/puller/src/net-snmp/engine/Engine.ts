import { randomBytes } from 'crypto';
import { ENGINE_DEFAULT_ID_PREFIX } from './Engine.constants';

export class Engine {
  public engineID: Buffer;
  public engineBoots: number;
  public engineTime: number;

  constructor(engineID?: Buffer | string, engineBoots?: number, engineTime?: number) {
    if (engineID) {
      if (!(engineID instanceof Buffer)) {
        engineID = engineID.replace('0x', '');
        this.engineID = Buffer.from(
          (engineID.toString().length % 2 == 1 ? '0' : '') + engineID.toString(),
          'hex'
        );
      } else {
        this.engineID = engineID;
      }
    } else {
      this.generateEngineID();
    }

    // TODO: Check. Set only defaults and no params
    this.engineBoots = 0;
    this.engineTime = 10;
  }

  public generateEngineID() {
    // generate a 17-byte engine ID in the following format:
    // 0x80 | 0x00B983 (enterprise OID) | 0x80 (enterprise-specific format) | 12 bytes of random
    this.engineID = Buffer.alloc(17);
    this.engineID.fill(ENGINE_DEFAULT_ID_PREFIX, 0, 5, 'hex');
    this.engineID.fill(randomBytes(12), 5, 17, 'hex');
  }
}
