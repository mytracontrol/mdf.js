export interface TaskItem {
  task: (...args: any[]) => any;
  args: any[];
  resolve: ((value: any) => void) | null;
  reject: ((reason: any) => void) | null;
}
