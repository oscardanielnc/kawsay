import type { Analysis, AnalysisRequest } from '@kawsay/contracts/insights';

/** The AI behind one method per use case (ADR 0007). Implementations validate their output. */
export abstract class AiPort {
  /** Throws AiDisabledError or AiUnavailableError. */
  abstract analyze(request: AnalysisRequest): Promise<Analysis>;
}
