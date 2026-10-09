import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { DomainError } from '../../domain/domain-error';
import { HttpProblem } from './http-problems';

/** RFC 9457 body. `code` is the stable extension clients branch on. */
export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail?: string;
  instance: string;
  code: string;
  [extension: string]: unknown;
}

/** The one place where domain errors become HTTP statuses. Unlisted domain errors are 422. */
const DOMAIN_ERROR_STATUS: Record<string, number> = {
  'auth.invalid_credentials': HttpStatus.UNAUTHORIZED,
  'auth.invalid_session': HttpStatus.UNAUTHORIZED,
  'auth.unauthenticated': HttpStatus.UNAUTHORIZED,
  'user.email_taken': HttpStatus.CONFLICT,
  'user.invalid_email': HttpStatus.BAD_REQUEST,
  'user.weak_password': HttpStatus.BAD_REQUEST,
};

const TITLES: Record<number, string> = {
  400: 'Bad Request',
  401: 'Unauthorized',
  404: 'Not Found',
  409: 'Conflict',
  413: 'Content Too Large',
  422: 'Unprocessable Content',
  429: 'Too Many Requests',
  500: 'Internal Server Error',
};

/**
 * Turns every error into a problem response. Unexpected errors are logged by name and code only: their messages
 * can quote the health data being written (ADR 0013).
 */
@Catch()
export class ProblemDetailsFilter implements ExceptionFilter {
  private readonly logger = new Logger(ProblemDetailsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();
    const problem = this.toProblem(exception, request.path);

    response.status(problem.status).type('application/problem+json').json(problem);
  }

  private toProblem(exception: unknown, instance: string): ProblemDetails {
    if (exception instanceof DomainError) {
      const status = DOMAIN_ERROR_STATUS[exception.code] ?? HttpStatus.UNPROCESSABLE_ENTITY;
      return this.problem(status, exception.code, instance, exception.message);
    }
    if (exception instanceof HttpProblem) {
      return {
        ...this.problem(exception.status, exception.code, instance, exception.message),
        ...exception.extensions,
      };
    }
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      return this.problem(status, `http.${status}`, instance, exception.message);
    }
    this.logger.error(`Unexpected ${nameOf(exception)} on ${instance}`);
    return this.problem(HttpStatus.INTERNAL_SERVER_ERROR, 'internal_error', instance);
  }

  private problem(status: number, code: string, instance: string, detail?: string): ProblemDetails {
    return {
      type: 'about:blank',
      title: TITLES[status] ?? 'Error',
      status,
      ...(detail ? { detail } : {}),
      instance,
      code,
    };
  }
}

function nameOf(exception: unknown): string {
  if (!(exception instanceof Error)) return 'non-error value';
  const code = (exception as { code?: unknown }).code;
  return typeof code === 'string' ? `${exception.name} (${code})` : exception.name;
}
