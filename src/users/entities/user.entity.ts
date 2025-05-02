export class User {
  userId: number;
  userName: string;
  email: string;
  passwordHash: string;
  registrationDate: Date;
}

export type SafeUser = Omit<User, 'passwordHash'>;
