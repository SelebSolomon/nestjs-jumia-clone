export const jwtConstants = {
  access_expires_in: process.env.ACCESS_TOKEN_EXPIRES_IN || '30m',
  refresh_expires_in: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
};
