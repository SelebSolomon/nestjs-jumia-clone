export interface JwtPayload {
  sub: string; // userId (standard practice)
  role: string;
}

export interface JwtRefreshPayload {
  sub: string;
  type: 'refresh';
}
