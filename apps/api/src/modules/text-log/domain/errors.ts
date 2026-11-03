import { DomainError } from '../../../shared/domain/domain-error';

/** 30 text logs or USD 0.10 in the last 24 h (ADR 0026): "vuelve mañana". */
export class TextLogLimitError extends DomainError {
  readonly code = 'ai.text_log_limit';

  constructor(readonly retryAfter: Date) {
    super('The daily limit of text logs was reached');
  }
}

/** The model failed, or did not give a valid proposal within the allowed rounds (ADR 0023). */
export class TextLogUnavailableError extends DomainError {
  readonly code = 'ai.text_log_unavailable';

  constructor() {
    super('The text could not be turned into a proposal; try again or use the search');
  }
}

/** Feedback for a call that does not exist or is not this user's. */
export class TextLogNotFoundError extends DomainError {
  readonly code = 'ai.text_log_not_found';

  constructor() {
    super('No such text log');
  }
}
