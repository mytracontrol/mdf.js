import { DLList } from '../dlList/DLList';
import { TaskItem } from './Sync.interfaces';

export class Sync {
  private _name: string;
  private _running = 0;
  private _queue = new DLList<TaskItem>(
    () => {
      return;
    },
    () => {
      return;
    }
  );

  constructor(name: string) {
    this._name = name;
  }

  public isEmpty(): boolean {
    return this._queue.length == 0;
  }

  private async _tryToRun(): Promise<void> {
    if (this._running < 1 && this._queue.length > 0) {
      this._running++;
      const taskItem: TaskItem | null = this._queue.shift();
      const cb = async () => {
        try {
          const returned = await taskItem?.task(...taskItem?.args);
          // return () => taskItem?.resolve?.(returned);
          taskItem?.resolve?.(returned);
        } catch (error) {
          // return () => taskItem?.reject?.(error);
          taskItem?.reject?.(error);
        }
      };

      this._running--;
      this._tryToRun();
      cb();
    }
  }

  public schedule(task: (...args: any[]) => any, ...args: any[]): Promise<any> {
    let resolve: ((value: any) => void) | null = null;
    let reject: ((reason: any) => void) | null = null;
    const promise = new Promise((_resolve, _reject) => {
      resolve = _resolve;
      reject = _reject;
    });
    const taskItem: TaskItem = { task, args, resolve, reject };
    this._queue.push(taskItem);
    this._tryToRun();
    return promise;
  }

  // ------------------ GETTERS ------------------

  public get name(): string {
    return this._name;
  }
}
