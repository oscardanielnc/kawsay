import { HttpStatus } from '@nestjs/common';

/** Errors that only make sense at the HTTP edge (invalid bodies). Business rule violations are `DomainError`s. */
export abstract class HttpProblem extends Error {
  abstract readonly status: number;
  abstract readonly code: string;
  readonly extensions: Record<string, unknown> = {};
}

export interface FieldError {
  field: string;
  message: string;
}

export class RequestValidationError extends HttpProblem {
  readonly status = HttpStatus.BAD_REQUEST;
  readonly code = 'validation_failed';

  constructor(readonly errors: FieldError[]) {
    super('The request is invalid');
    this.extensions.errors = errors;
  }
}
