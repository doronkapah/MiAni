/** סיכום הצריכה שנשמרה מקומית, לתצוגה בלוח ההורים. */

import { estimateCost, findModel, type TokenCounts } from "../../../shared/models";
import { usageLog } from "../store/local";

export interface UsageSummary {
  requests: number;
  tokens: TokenCounts;
  /** בדולרים, הערכה */
  cost: number;
}

const EMPTY: TokenCounts = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 };

function summarize(matches: (day: string) => boolean): UsageSummary {
  const log = usageLog();
  const tokens: TokenCounts = { ...EMPTY };
  let requests = 0;
  let cost = 0;

  for (const [day, entry] of Object.entries(log)) {
    if (!matches(day)) continue;
    requests += entry.requests;
    for (const [modelId, counts] of Object.entries(entry.models)) {
      tokens.input += counts.input;
      tokens.output += counts.output;
      tokens.cacheRead += counts.cacheRead;
      tokens.cacheWrite += counts.cacheWrite;
      const model = findModel(modelId);
      if (model) cost += estimateCost(model, counts);
    }
  }

  return { requests, tokens, cost };
}

export function usageSummaries() {
  const today = new Date().toISOString().slice(0, 10);
  const month = today.slice(0, 7);
  return {
    today: summarize((day) => day === today),
    month: summarize((day) => day.startsWith(month)),
    total: summarize(() => true),
  };
}
