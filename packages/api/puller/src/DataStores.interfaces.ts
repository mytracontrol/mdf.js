export interface RegistrationResult {
  success: boolean;
  wait?: number;
  reservoir?: any;
}

export interface SubmissionResult {
  reachedHWM: boolean;
  blocked: boolean;
  strategy: number;
}

export interface FreeResult {
  running: number;
}
