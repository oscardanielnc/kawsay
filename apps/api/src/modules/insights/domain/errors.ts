import { DomainError } from '../../../shared/domain/domain-error';

/** The user already ran the allowed analyses in the last 24 h (F17). */
export class AnalysisLimitError extends DomainError {
  readonly code = 'insights.limit_reached';

  constructor(readonly retryAfter: Date) {
    super('The daily analysis limit was reached');
  }
}

/** The server has no AI key configured. */
export class AiDisabledError extends DomainError {
  readonly code = 'insights.ai_disabled';

  constructor() {
    super('AI analyses are not enabled on this server');
  }
}

/** The AI did not answer, or answered twice with something invalid (ADR 0007). */
export class AiUnavailableError extends DomainError {
  readonly code = 'insights.ai_unavailable';

  constructor() {
    super('The AI could not produce an analysis; try again later');
  }
}
