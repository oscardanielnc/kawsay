import type { Analysis, AnalysisRequest, Summary } from '@kawsay/contracts/insights';

/** The AI behind one method per use case (ADR 0007). Implementations validate their output. */
export abstract class AiPort {
  /** Throws AiDisabledError or AiUnavailableError. */
  abstract analyze(request: AnalysisRequest): Promise<Analysis>;
  /** The short summary of the F17 redesign (ADR 0022). Same errors. */
  abstract summarize(request: AnalysisRequest): Promise<Summary>;
}
