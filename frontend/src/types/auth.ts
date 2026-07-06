export type UserSummary = {
  id: number;
  name: string;
  email: string;
  title: string | null;
  bio: string | null;
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

export type UpdateProfileRequest = {
  name: string;
  title?: string | null;
  bio?: string | null;
};
