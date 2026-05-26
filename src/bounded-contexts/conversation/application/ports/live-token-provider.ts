export type LiveToken = {
  token: string;
  expiresAt: string;
  model: string;
};

export interface LiveTokenProvider {
  mint(): Promise<LiveToken>;
}
