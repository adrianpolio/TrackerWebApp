export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthResponseDto {
  userId: string;
  email: string;
  name: string;
  role: string;
  token: string;
}