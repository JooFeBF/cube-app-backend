export enum TournamentStatus {
  PLANNED = 'Planned',
  ONGOING = 'Ongoing',
  FINISHED = 'Finished',
  CANCELLED = 'Cancelled',
}

export class Tournament {
  tournamentId: number;
  tournamentName: string;
  startDateTime: Date;
  status: TournamentStatus;
  creatorId: number;
  modalityId: string;
}
