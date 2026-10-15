import { z } from 'zod';

const text = z.string();
const editableNumber = z.union([z.number().finite(), z.literal('')]);
const source = z.object({ id: text, name: text, text, warning: text.default('') });
const claim = z.object({ id: text, text, origin: z.enum(['explicit', 'inferred', 'unknown']), source_id: text, quote: text, confirmed: z.boolean() });
const accent = z.object({ id: text, claim_id: text, object: text, intent: z.enum(['emphasize', 'normalize', 'implicit', 'delay', 'open']), means: text, interpretation: text, undesired: text });
const evidence = z.object({ field: text, value: text, origin: z.enum(['explicit', 'inferred', 'unknown']), source_id: text, quote: text, reason: text });
const spec = z.object({ communication_goal: text, audience_start: text, target_change: text, viewer_action: text,
  main_message: text, conflict: text, promise: text, structure: text, rationale: text,
  evidence: z.array(evidence), assumptions: z.array(text), questions: z.array(text) });
const scene = z.object({ id: text, title: text, duration: z.number().finite(), visual: text, speech: text, purpose: text,
  claim_ids: z.array(text), accent_ids: z.array(text), emotion: text });
const variant = z.object({ id: text, title: text, approach: text, logline: text, rationale: text, tradeoff: text, scenes: z.array(scene) });
const check = z.object({ code: text, label: text, status: z.enum(['pass', 'fail', 'warn', 'manual']), detail: text, scene_id: text });
const report = z.object({ variant_id: text, duration: z.number().finite(), words: z.number().finite(), speech_seconds: z.number().finite(),
  bad_sentences: z.array(z.object({ scene_id: text, text, words: z.number().finite() })), checks: z.array(check), passes: z.number(), failures: z.number() });
const brief = z.object({ spec, fingerprint: text, mode: z.enum(['llm', 'template']), approved: z.boolean(),
  inputKey: text, created: text }).passthrough();
const result = z.object({ variants: z.array(variant), reports: z.array(report), mode: z.enum(['llm', 'template']),
  fingerprint: text, inputKey: text, specKey: text, reviewKey: text, created: text }).passthrough();

export const projectSchema = z.object({
  id: text, title: text, client: text, task: text, audience: text, before: text, desired: text, action: text, success: text,
  claims: z.array(claim), sources: z.array(source), accents: z.array(accent),
  constraints: z.object({ duration: editableNumber, tolerance: editableNumber, wpm: editableNumber,
    min_words: editableNumber, max_words: editableNumber, silent_seconds: editableNumber, variants: editableNumber,
    must_include: text, forbidden: text, medium: text, channel: text, aspect: text }),
  tone: z.object({ voice: text, formality: z.number().finite(), warmth: z.number().finite(), humor: z.number().finite(), intensity: z.number().finite(), reference: text }),
  ontoton: z.object({ world: text, values: text, emotion: text, narrative: text, dynamics: text, empathy: text, reality: text }),
  effects: z.array(z.enum(['knowledge', 'beliefs', 'values', 'emotion', 'intention', 'action'])),
  design: z.object({ order: z.enum(['auto', 'chronological', 'reordered']), information: z.enum(['auto', 'less', 'same', 'more', 'variable']),
    ending: z.enum(['auto', 'closed', 'open']), perspective: text, com_b: z.array(z.enum(['capability', 'opportunity', 'motivation'])) }),
  brief: brief.nullable(), result: result.nullable(), selected: text, approved_checks: z.record(z.boolean()), updated: text,
  revisions: z.array(z.discriminatedUnion('type', [
    z.object({ type: z.literal('spec'), created: text, data: brief }),
    z.object({ type: z.literal('variants'), created: text, data: result }),
  ])),
}).passthrough();
