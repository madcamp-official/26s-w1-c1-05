export type UserSummary = {
  id: number;
  name: string;
  email: string;
};

export type AuthResponse = {
  user: UserSummary;
  accessToken: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type SignupRequest = {
  name: string;
  email: string;
  password: string;
};
