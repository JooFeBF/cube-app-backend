export enum SolutionPenalty {
  OK = 'OK',
  PLUS_TWO = '+2',
  DNF = 'DNF',
}

export class Solution {
  solutionId: number;
  userId: number;
  tournamentId: number;
  scrambleId: number;
  recordedTimeMs: number;
  penalty: SolutionPenalty;
  recordDateTime: Date;
}
