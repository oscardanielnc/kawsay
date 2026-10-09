import type { Db, RecordEnv } from '../db/types';
import {
  type AccountState,
  chooseLocalOnly,
  forgetAccount,
  markSynced,
  readAccount,
  rememberAccount,
} from './account';
import { type ApiClient, InvalidCredentialsError, SignedOutError } from './api-client';
import { pendingCount, syncOnce } from './engine';

export type SyncStatus = 'idle' | 'syncing' | 'offline' | 'session-ended' | 'error';

export interface SyncState {
  /** `undefined` until read from the database. */
  account: AccountState | undefined;
  status: SyncStatus;
  /** Local records not on the server yet. */
  pending: number;
}

/** Waits this long after a write before syncing, so a burst of taps becomes one push. */
export const WRITE_DEBOUNCE_MS = 5_000;

/**
 * When and how the phone syncs (F02): on open, on reconnect and shortly after writes, one run at a time. A run that
 * fails offline just waits for the next trigger; a session the server ended leaves the phone working on its own.
 */
export class SyncController {
  private state: SyncState = { account: undefined, status: 'idle', pending: 0 };
  private listeners = new Set<(state: SyncState) => void>();
  private running: Promise<void> | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly db: Db,
    private readonly env: RecordEnv,
    private readonly client: ApiClient,
  ) {}

  get current(): SyncState {
    return this.state;
  }

  subscribe(listener: (state: SyncState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /** Reads the account and pending count; syncs right away when signed in (app open). */
  async start(): Promise<void> {
    await this.refreshState();
    if (this.state.account?.kind === 'signed-in') await this.sync();
  }

  async signIn(email: string, password: string): Promise<'ok' | 'invalid' | 'offline'> {
    let account: { userId: string; email: string };
    try {
      account = await this.client.signIn(email, password);
    } catch (error) {
      if (error instanceof InvalidCredentialsError) return 'invalid';
      return 'offline';
    }
    await rememberAccount(this.db, account);
    await this.refreshState();
    await this.sync();
    return 'ok';
  }

  async useWithoutAccount(): Promise<void> {
    await chooseLocalOnly(this.db);
    await this.refreshState();
  }

  async signOut(): Promise<void> {
    await this.client.signOut();
    await forgetAccount(this.db);
    await this.refreshState({ status: 'idle' });
  }

  /** A write happened: sync once things calm down. */
  schedule(delayMs = WRITE_DEBOUNCE_MS): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.timer = null;
      void this.sync();
    }, delayMs);
  }

  stop(): void {
    if (this.timer) clearTimeout(this.timer);
    this.listeners.clear();
  }

  /** One run at a time: a call during a run waits for it, then runs again to catch what it missed. */
  async sync(): Promise<void> {
    if (this.running) await this.running;
    this.running = this.run().finally(() => {
      this.running = null;
    });
    return this.running;
  }

  private async run(): Promise<void> {
    if ((await readAccount(this.db)).kind !== 'signed-in') return;
    this.emit({ status: 'syncing' });
    let status: SyncStatus = 'idle';
    try {
      await syncOnce(this.db, this.env, this.client.sync);
      await markSynced(this.db, this.env.now());
    } catch (error) {
      if (error instanceof SignedOutError) {
        await forgetAccount(this.db);
        status = 'session-ended';
      } else {
        status = error instanceof TypeError ? 'offline' : 'error';
      }
    }
    await this.refreshState({ status });
  }

  private async refreshState(patch: Partial<SyncState> = {}): Promise<void> {
    const [account, pending] = await Promise.all([readAccount(this.db), pendingCount(this.db)]);
    this.emit({ account, pending, ...patch });
  }

  private emit(patch: Partial<SyncState>): void {
    this.state = { ...this.state, ...patch };
    for (const listener of this.listeners) listener(this.state);
  }
}
