export type SignupRequest = {
  handle: string,
  displayName: string,
  password: string,
  confirmPassword: string,
  email: string
};

export type LoginRequest = {
  handle?: string,
  email?: string,
  password: string
};
