export let DEBUG_FLAG = false;

export function setDebugFlag(flag: boolean) {
  DEBUG_FLAG = flag;
}
export function debug(line: string) {
  if (DEBUG_FLAG) {
    console.debug(line);
  }
}
