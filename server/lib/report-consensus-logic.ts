/** Good-faith rejection codes (partial refund to reporter) */
export const GOOD_FAITH_CODES = ["R1", "R2", "R3", "R4", "R5"] as const;
/** Bad-faith rejection codes (heavier penalty) */
export const BAD_FAITH_CODES = ["B1", "B2", "B3", "B4", "B5", "B6"] as const;

export type GoodFaithCode = (typeof GOOD_FAITH_CODES)[number];
export type BadFaithCode = (typeof BAD_FAITH_CODES)[number];

export type ConsensusOutcome = "accepted" | "good_faith" | "bad_faith";

export type VoteRow = {
  action: string;
  rejectionTier: string | null;
  rejectionCode: string | null;
};

export type ValidatorVoteRow = VoteRow & { reviewerId: string };

const GOOD_SET = new Set<string>(GOOD_FAITH_CODES);
const BAD_SET = new Set<string>(BAD_FAITH_CODES);

export function isGoodFaithCode(code: string): code is GoodFaithCode {
  return GOOD_SET.has(code);
}

export function isBadFaithCode(code: string): code is BadFaithCode {
  return BAD_SET.has(code);
}

/** Vote tier: accept → good-faith reject → bad-faith reject */
export function voteBucket(v: VoteRow): "a" | "g" | "b" {
  if (v.action === "accepted") return "a";
  if (v.rejectionTier === "bad_faith") return "b";
  return "g";
}

export function countAbg(reviews: VoteRow[]) {
  let a = 0;
  let g = 0;
  let b = 0;
  for (const v of reviews) {
    const k = voteBucket(v);
    if (k === "a") a++;
    else if (k === "g") g++;
    else b++;
  }
  return { a, g, b, n: reviews.length };
}

/**
 * Final outcome for the reporter.
 * With 3 validators: 2+ accept → accepted; 2+ bad-faith → bad_faith; 2+ good-faith → good_faith; 1-1-1 → good_faith.
 * With 5+ votes: absolute majority (> half); otherwise tie-break favoring good_faith.
 */
export function resolveReporterOutcome(reviews: VoteRow[]): ConsensusOutcome {
  const { a, g, b, n } = countAbg(reviews);
  if (n === 0) return "good_faith";

  if (n === 3) {
    if (a >= 2) return "accepted";
    if (b >= 2) return "bad_faith";
    if (g >= 2) return "good_faith";
    if (a === 1 && g === 1 && b === 1) return "good_faith";
    return "good_faith";
  }

  const need = Math.floor(n / 2) + 1;
  if (a >= need) return "accepted";
  if (b >= need) return "bad_faith";
  if (g >= need) return "good_faith";

  const scores = [
    { c: g, v: "good_faith" as const },
    { c: a, v: "accepted" as const },
    { c: b, v: "bad_faith" as const },
  ];
  scores.sort((x, y) => y.c - x.c);
  if (scores[0].c === scores[1].c) {
    const tops = scores.filter((s) => s.c === scores[0].c).map((s) => s.v);
    if (tops.includes("good_faith")) return "good_faith";
    if (tops.includes("accepted")) return "accepted";
    return "bad_faith";
  }
  return scores[0].v;
}

export function outcomeToLevel(o: ConsensusOutcome): 0 | 1 | 2 {
  if (o === "accepted") return 0;
  if (o === "good_faith") return 1;
  return 2;
}

export function reviewToLevel(v: VoteRow): 0 | 1 | 2 {
  if (v.action === "accepted") return 0;
  if (v.rejectionTier === "bad_faith") return 2;
  return 1;
}

export function pickOutcomeRejectionCode(
  outcome: ConsensusOutcome,
  reviews: VoteRow[],
): string | null {
  if (outcome === "accepted") return null;
  const bucket = outcome === "good_faith" ? "g" : "b";
  const codes = reviews
    .filter((r) => voteBucket(r) === bucket)
    .map((r) => r.rejectionCode)
    .filter((c): c is string => !!c && c.length > 0);
  if (codes.length === 0) return null;
  const freq = new Map<string, number>();
  for (const c of codes) freq.set(c, (freq.get(c) ?? 0) + 1);
  let best = codes[0];
  let bestN = -1;
  for (const [c, f] of freq) {
    if (f > bestN || (f === bestN && c.localeCompare(best) < 0)) {
      best = c;
      bestN = f;
    }
  }
  return best;
}

export type ValidatorPayoutLine = {
  reviewerId: string;
  refund: number;
  bonus: number;
  penalty: number;
};

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Validator payouts after the outcome is final.
 * 3 validators: always nominal refund; if vote matches outcome + bonus (default 1.5);
 * bad-faith reject when outcome is accepted → extra penalty.
 * 5 validators: match majority → refund + bonus 2; minority one level off → refund only; two levels off → no refund;
 * bad-faith reject vs accepted outcome → penalty.
 */
export function computeValidatorPayouts(
  reviews: ValidatorVoteRow[],
  outcome: ConsensusOutcome,
  settings: {
    refund: number;
    bonus3: number;
    bonus5: number;
    badFaithVsApprovePenalty: number;
  },
): ValidatorPayoutLine[] {
  const n = reviews.length;
  const outcomeLvl = outcomeToLevel(outcome);
  const refund = round2(settings.refund);
  const bonus3 = round2(settings.bonus3);
  const bonus5 = round2(settings.bonus5);
  const pen = round2(settings.badFaithVsApprovePenalty);

  return reviews.map((r) => {
    const vl = reviewToLevel(r);
    const match = vl === outcomeLvl;
    const diff = Math.abs(vl - outcomeLvl);
    const badFaithAgainstApprove =
      outcome === "accepted" && r.action === "rejected" && r.rejectionTier === "bad_faith";

    let refundAmt = 0;
    let bonusAmt = 0;
    let penaltyAmt = 0;

    if (n === 3) {
      refundAmt = refund;
      if (match) bonusAmt = bonus3;
      if (badFaithAgainstApprove) penaltyAmt = pen;
      return { reviewerId: r.reviewerId, refund: refundAmt, bonus: bonusAmt, penalty: penaltyAmt };
    }

    if (n >= 5) {
      if (match) {
        refundAmt = refund;
        bonusAmt = bonus5;
      } else if (diff === 1) {
        refundAmt = refund;
      } else {
        refundAmt = 0;
      }
      if (badFaithAgainstApprove) penaltyAmt = pen;
      return { reviewerId: r.reviewerId, refund: refundAmt, bonus: bonusAmt, penalty: penaltyAmt };
    }

    /* 4 votes or middle case: same rules as 3 validators */
    refundAmt = refund;
    if (match) bonusAmt = bonus3;
    if (badFaithAgainstApprove) penaltyAmt = pen;
    return { reviewerId: r.reviewerId, refund: refundAmt, bonus: bonusAmt, penalty: penaltyAmt };
  });
}
