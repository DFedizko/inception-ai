import { inject, injectable } from "inversify";
import type { LiveToken, LiveTokenProvider } from "../ports/live-token-provider";
import { TYPES } from "../tokens";

@injectable()
export class IssueLiveToken {
  constructor(
    @inject(TYPES.LiveTokenProvider)
    private readonly liveTokens: LiveTokenProvider,
  ) {}

  async execute(instruction?: string | null): Promise<LiveToken> {
    return this.liveTokens.mint(instruction);
  }
}
