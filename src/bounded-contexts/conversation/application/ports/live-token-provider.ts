export type LiveToken = {
  token: string;
  expiresAt: string;
  model: string;
};

export interface LiveTokenProvider {
  mint(instruction?: string | null): Promise<LiveToken>;
}
