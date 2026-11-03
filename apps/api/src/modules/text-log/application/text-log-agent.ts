import type { ProposedEntry, TextLogProposal, TextLogRequest } from '@kawsay/contracts/text-log';
import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { AgentModel, type ChatMessage, type ModelUsage, type ToolCall } from './ports/agent-model';
import { ItemSearch, type SearchItem } from './ports/item-search';
import { TEXT_LOG_TOOLS, textLogSystemPrompt, textLogUserMessage } from './text-log-prompt';

/** ADR 0023: at most 4 model rounds and 1 retry on invalid output. */
export const MAX_ROUNDS = 4;

const meal = z.enum(['breakfast', 'lunch', 'dinner', 'snack']);
const kind = z.enum(['food', 'dish']);
const PortionArgs = z.union([
  z.object({ servings: z.number().positive().max(10) }),
  z.object({ grams: z.number().positive().max(3000) }),
  z.object({ unit: z.string().min(1).max(60), count: z.number().positive().max(20) }),
]);
/** What the model may send to propose_entries; extra fields (a "kcal") are stripped, never used. */
const ProposalArgs = z.object({
  entries: z
    .array(
      z.object({
        meal,
        kind,
        catalogId: z.string().min(1).max(80),
        portion: PortionArgs,
        confidence: z.enum(['low', 'medium', 'high']).default('medium'),
      }),
    )
    .max(15),
  unmatched: z
    .array(z.object({ meal, text: z.string().min(1).max(80) }))
    .max(10)
    .default([]),
  question: z
    .object({
      text: z.string().min(1).max(120),
      options: z
        .array(z.object({ label: z.string().min(1).max(40), catalogId: z.string(), kind }))
        .min(2)
        .max(4),
      replaces: z.string(),
    })
    .optional(),
});
const SearchArgs = z.object({ query: z.string().trim().min(1).max(60), kind: kind.optional() });
const UnitsArgs = z.object({ id: z.string().min(1).max(80) });

export type AgentOutcome =
  | { outcome: 'ok'; proposal: Omit<TextLogProposal, 'id'>; rounds: number; usage: ModelUsage }
  | { outcome: 'invalid'; rounds: number; usage: ModelUsage };

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/**
 * The text logging agent (F16, ADR 0023): a small tool loop over read-only catalog tools. The model only picks ids
 * and portions; ids it invents become unmatched, and the phone computes every number (ADR 0008, 0026).
 */
@Injectable()
export class TextLogAgent {
  constructor(
    private readonly model: AgentModel,
    private readonly search: ItemSearch,
  ) {}

  async run(userId: string, request: TextLogRequest): Promise<AgentOutcome> {
    const messages: ChatMessage[] = [
      { role: 'system', content: textLogSystemPrompt(request) },
      { role: 'user', content: textLogUserMessage(request.text) },
    ];
    const usage: ModelUsage = { tokensIn: 0, tokensCached: 0, tokensOut: 0 };
    let retried = false;

    for (let round = 1; round <= MAX_ROUNDS; round++) {
      const turn = await this.model.step(messages, TEXT_LOG_TOOLS);
      usage.tokensIn += turn.usage.tokensIn;
      usage.tokensCached += turn.usage.tokensCached;
      usage.tokensOut += turn.usage.tokensOut;
      messages.push(turn.message);
      const calls = turn.message.toolCalls ?? [];

      if (calls.length === 0) {
        if (retried) return { outcome: 'invalid', rounds: round, usage };
        retried = true;
        messages.push({ role: 'user', content: 'Responde llamando a propose_entries.' });
        continue;
      }

      for (const call of calls) {
        if (call.name !== 'propose_entries') {
          messages.push({
            role: 'tool',
            toolCallId: call.id,
            content: await this.tool(userId, call),
          });
          continue;
        }
        const args = ProposalArgs.safeParse(parseJson(call.arguments));
        if (args.success) {
          const proposal = await this.finalize(userId, args.data);
          return { outcome: 'ok', proposal, rounds: round, usage };
        }
        if (retried) return { outcome: 'invalid', rounds: round, usage };
        retried = true;
        messages.push({
          role: 'tool',
          toolCallId: call.id,
          content: JSON.stringify({
            error: 'argumentos inválidos',
            issues: args.error.issues.slice(0, 5),
          }),
        });
      }
    }
    return { outcome: 'invalid', rounds: MAX_ROUNDS, usage };
  }

  /** Runs a read-only tool; invalid arguments get an error the model can fix. */
  private async tool(userId: string, call: ToolCall): Promise<string> {
    const raw = parseJson(call.arguments);
    if (call.name === 'search_catalog') {
      const args = SearchArgs.safeParse(raw);
      if (!args.success) return JSON.stringify({ error: 'query es obligatorio (texto ≤ 60)' });
      const items = await this.search.search(userId, args.data.query, args.data.kind);
      return JSON.stringify(items.slice(0, 8).map(view));
    }
    if (call.name === 'get_units') {
      const args = UnitsArgs.safeParse(raw);
      const item = args.success ? await this.search.get(userId, args.data.id) : null;
      return JSON.stringify(
        item ? { id: item.id, units: item.units } : { error: 'id desconocido' },
      );
    }
    return JSON.stringify({ error: `herramienta desconocida: ${call.name}` });
  }

  /** Unknown ids become unmatched (ADR 0026); portions are fitted to the item's real units. */
  private async finalize(
    userId: string,
    args: z.infer<typeof ProposalArgs>,
  ): Promise<Omit<TextLogProposal, 'id'>> {
    const entries: ProposedEntry[] = [];
    const unmatched = [...args.unmatched];
    for (const entry of args.entries) {
      const item = await this.search.get(userId, entry.catalogId);
      if (!item) {
        unmatched.push({
          meal: entry.meal,
          text: entry.catalogId.replace(/[-_]/g, ' ').slice(0, 80),
        });
        continue;
      }
      entries.push({
        meal: entry.meal,
        kind: item.kind,
        catalogId: item.id,
        name: item.name,
        portion: fitPortion(entry.portion, item),
        confidence: entry.confidence,
      });
    }
    let question: TextLogProposal['question'];
    if (args.question && entries.some((e) => e.catalogId === args.question!.replaces)) {
      const options = [];
      for (const option of args.question.options) {
        const item = await this.search.get(userId, option.catalogId);
        if (item) options.push({ label: option.label, catalogId: item.id, kind: item.kind });
      }
      if (options.length >= 2)
        question = { text: args.question.text, options, replaces: args.question.replaces };
    }
    return {
      entries: entries.slice(0, 15),
      unmatched: unmatched.slice(0, 10),
      ...(question && { question }),
    };
  }
}

const view = (item: SearchItem) => ({
  id: item.id,
  kind: item.kind,
  name: item.name,
  units: item.units.map((u) => u.label),
});

/** A unit the item does not have becomes its first unit, or grams; a dish is logged in servings. */
function fitPortion(
  portion: z.infer<typeof PortionArgs>,
  item: SearchItem,
): ProposedEntry['portion'] {
  if ('servings' in portion) return { servings: portion.servings };
  if ('grams' in portion) return { grams: portion.grams };
  if (item.kind === 'dish') return { servings: portion.count };
  const unit =
    item.units.find((u) => u.label.toLowerCase() === portion.unit.toLowerCase()) ?? item.units[0];
  return unit ? { unit: unit.label, count: portion.count } : { grams: 100 * portion.count };
}
