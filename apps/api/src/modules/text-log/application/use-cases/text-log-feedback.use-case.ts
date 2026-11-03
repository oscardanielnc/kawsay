import type { TextLogFeedback } from '@kawsay/contracts/text-log';
import { Injectable } from '@nestjs/common';
import { TextLogNotFoundError } from '../../domain/errors';
import { AiCallLog } from '../ports/ai-call-log';

/** What the user kept, edited or removed is stored with its call: free labels for the evals (ADR 0024, 0025). */
@Injectable()
export class TextLogFeedbackUseCase {
  constructor(private readonly calls: AiCallLog) {}

  async execute(userId: string, id: string, feedback: TextLogFeedback): Promise<void> {
    if (!(await this.calls.feedback(userId, id, feedback))) throw new TextLogNotFoundError();
  }
}
