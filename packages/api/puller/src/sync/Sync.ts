import { DLList } from '../dlList/DLList';
import { RejectType, ResolveType, TaskItem } from './Sync.interfaces';

export class Sync {
  private name: string;
  private _running = 0;
  // TODO: Check, error bc in original DLList is created without args
  private _queue = new DLList<TaskItem>(
    () => {
      return;
    },
    () => {
      return;
    }
  );

  constructor(name: string) {
    this.name = name;
  }

  public isEmpty(): boolean {
    return this._queue.length == 0;
  }

  private async _tryToRun(): Promise<void> {
    if (this._running < 1 && this._queue.length > 0) {
      this._running++;
      const taskItem: TaskItem | null = this._queue.shift();
      const cb = async (): Promise<void> => {
        try {
          const returned = await taskItem?.task(...taskItem?.args);
          taskItem?.resolve?.(returned);
        } catch (error) {
          taskItem?.reject?.(error);
        }
      };

      this._running--;
      this._tryToRun();
      cb();
    }
  }

  public schedule(task: (...args: any[]) => any, ...args: any[]): Promise<any> {
    let resolve: ResolveType = null;
    let reject: RejectType = null;
    const promise = new Promise<any>((_resolve, _reject) => {
      resolve = _resolve;
      reject = _reject;
    });
    const taskItem: TaskItem = { task, args, resolve, reject };
    this._queue.push(taskItem);
    this._tryToRun();
    return promise;
  }
}
