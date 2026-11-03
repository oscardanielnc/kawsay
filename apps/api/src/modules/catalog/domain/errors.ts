import { DomainError } from '../../../shared/domain/domain-error';

/** The user already created the allowed AI dishes in the last 24 h. */
export class DishLimitError extends DomainError {
  readonly code = 'catalog.ai_dish_limit';

  constructor(readonly retryAfter: Date) {
    super('The daily limit of AI dishes was reached');
  }
}

/** The AI did not answer, or twice without a usable recipe (ADR 0007). */
export class DishUnavailableError extends DomainError {
  readonly code = 'catalog.ai_dish_unavailable';

  constructor() {
    super('The AI could not propose a recipe; try again later or create it by hand');
  }
}
