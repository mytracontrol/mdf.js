import { RemoteInfo } from 'dgram';
import { FeedCallback, ReqOptions, ResponseCallback } from '.';
import { AgentCallback } from '../agent';
import { Engine } from '../engine';
import { Message } from '../message';
import { Pdu } from '../pdu/pduUtils';
import { DoneCallback, Session } from '../session';
import { User } from '../user.interface';

export class Req {
  private _message: Message;
  public retries: number;
  public timeout: number;
  public timer: NodeJS.Timeout | undefined;
  private _backoff: number;
  public port: number;
  private _context: string;

  // TODO: Check. Added, set outside
  private _baseOid: string;
  public error: Error | null;
  public options: ReqOptions;

  private _table: any;
  private _columns: string[];
  private _rowOid: string;
  private _maxRepetitions: number;
  public originalPdu: Pdu;
  public allowReport: boolean;

  public proxiedRinfo: RemoteInfo | undefined;
  public proxiedPduId: number | undefined;
  public proxiedUser: User;
  public proxiedEngine: Engine | undefined;

  responseCb: ResponseCallback | AgentCallback;
  onResponse: (req: Req, message: Message) => void;
  feedCb: FeedCallback | null;
  doneCb: DoneCallback;

  constructor(
    session: Session,
    message: Message,
    feedCb: FeedCallback | null,
    responseCb: ResponseCallback | AgentCallback,
    options?: ReqOptions
  ) {
    this._message = message;
    this.responseCb = responseCb;
    this.retries = session.retries;
    this.timeout = session.timeout;
    // Add timeout backoff
    this._backoff = session.backoff;
    this.onResponse = session.onSimpleGetResponse;
    this.feedCb = feedCb;
    this.port = options && options.port ? options.port : session.port;
    this._context = session.context;
  }

  public getId() {
    return this._message.getReqId();
  }

  public get message() {
    return this._message;
  }

  public get backoff(): number {
    return this._backoff;
  }

  public get baseOid(): string {
    return this._baseOid;
  }

  public get table(): any {
    return this._table;
  }

  public get columns(): string[] {
    return this._columns;
  }

  public get rowOid(): string {
    return this._rowOid;
  }

  public get maxRepetitions(): number {
    return this._maxRepetitions;
  }
}
