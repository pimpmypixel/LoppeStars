export type OAuthProvider = 'google' | 'facebook';

export type ParsedParams = {
  access_token?: string;
  refresh_token?: string;
  code?: string;
  error?: string;
  error_description?: string;
};