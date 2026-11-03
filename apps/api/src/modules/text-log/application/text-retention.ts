import {
  Injectable,
  Logger,
  type OnApplicationBootstrap,
  type OnModuleDestroy,
} from '@nestjs/common';
import { Clock } from '../../../shared/application/ports/clock';
import { AiCallLog } from './ports/ai-call-log';

/** ADR 0024: the input text is kept 90 days for the owner's review, then cleared. */
export const TEXT_RETENTION_DAYS = 90;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Clears old input texts at start and then once a day; a plain timer, no queue. */
@Injectable()
export class TextRetention implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly logger = new Logger(TextRetention.name);
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly calls: AiCallLog,
    private readonly clock: Clock,
  ) {}

  async run(): Promise<number> {
    const before = new Date(this.clock.now().getTime() - TEXT_RETENTION_DAYS * DAY_MS);
    return this.calls.forgetTextBefore(before);
  }

  onApplicationBootstrap(): void {
    const sweep = () =>
      void this.run().catch((error: unknown) =>
        this.logger.warn(`retention failed: ${error instanceof Error ? error.name : 'unknown'}`),
      );
    sweep();
    this.timer = setInterval(sweep, DAY_MS);
    this.timer.unref();
  }

  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }
}
