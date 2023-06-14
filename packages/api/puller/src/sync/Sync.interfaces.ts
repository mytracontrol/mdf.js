export interface TaskItem {
  task: (...args: any[]) => any;
  args: any[];
  resolve: ResolveType;
  reject: RejectType;
}

export type ResolveType = ((value: any | PromiseLike<any>) => void) | null;
export type RejectType = ((reason: any) => void) | null;
