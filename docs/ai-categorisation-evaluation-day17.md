# Day 17 AI Categorisation Evaluation

**Evaluation date:** 27 November 2026  
**Results source:** User-provided live evaluation results from the existing
repeatable evaluation script. The evaluation was not rerun during this work.

## Configuration and dataset

- Provider: Google Gemini
- Model: `gemini-3.5-flash-lite`
- Prompt version: `categorise-ticket.v2`
- Pricing tier recorded in logs: `free`
- Estimated cost recorded in logs: USD 0
- Dataset: 20 synthetic labelled tickets, self-prepared with ChatGPT assistance
- Evaluation method: existing `apps/api/scripts/evaluate-ai-categorisation.ts`
- Expected labels: unchanged from `apps/api/tests/fixtures/ai/labelled-tickets.json`
- Prompt: unchanged during this evaluation report work

## Overall result

| Measure | Result |
|---|---:|
| Total synthetic labelled tickets | 20 |
| Successfully evaluated | 20 |
| Correct predictions | 16 |
| Incorrect predictions | 4 |
| Failed requests | 0 |
| Overall accuracy | 80% |
| Required accuracy | 80% |
| Outcome | Threshold met exactly |

**Calculation:** `correct predictions / successfully evaluated tickets × 100`  
`16 / 20 × 100 = 80%`

## Individual ticket results

The expected labels below are from the supplied fixture. Per the reported
results, `om1`–`om16` matched their labels; `om17`–`om20` were predicted as
General instead of Other.

| Test ID | Expected category | Predicted category | Result |
|---|---|---|---|
| om1 | Technical | Technical | Correct |
| om2 | Technical | Technical | Correct |
| om3 | Technical | Technical | Correct |
| om4 | Technical | Technical | Correct |
| om5 | Billing | Billing | Correct |
| om6 | Billing | Billing | Correct |
| om7 | Billing | Billing | Correct |
| om8 | Billing | Billing | Correct |
| om9 | Account | Account | Correct |
| om10 | Account | Account | Correct |
| om11 | Account | Account | Correct |
| om12 | Account | Account | Correct |
| om13 | General | General | Correct |
| om14 | General | General | Correct |
| om15 | General | General | Correct |
| om16 | General | General | Correct |
| om17 | Other | General | Incorrect |
| om18 | Other | General | Incorrect |
| om19 | Other | General | Incorrect |
| om20 | Other | General | Incorrect |

## Category-wise accuracy

| Expected category | Correct / total | Accuracy |
|---|---:|---:|
| Technical | 4 / 4 | 100% |
| Billing | 4 / 4 | 100% |
| Account | 4 / 4 | 100% |
| General | 4 / 4 | 100% |
| Other | 0 / 4 | 0% |

## Observations

- The reported aggregate met the 80% threshold exactly, with no margin above
  the required minimum.
- All four Other examples were classified as General. The reported results
  indicate a specific distinction problem between those labels in this
  dataset.
- No request failures were reported.
- No expected labels or prompts were altered to improve the score.

## Limitations

- The evaluation used only 20 self-prepared synthetic examples, with ChatGPT
  assistance. It does not establish performance on real-world or independently
  authored tickets.
- Results reflect one reported run, model, and prompt version. Reproducibility
  and variation across repeated runs were not assessed here.
- The result and pricing/cost metadata are user-provided; this session did not
  rerun the script or independently inspect provider logs.
- A recorded free pricing tier and USD 0 estimate describe the reported logs;
  they are not a guarantee of future account billing or quota behavior.
- Priority accuracy was not provided and is not reported.

## Future improvements

1. Review the intended boundary between Other and General with an independently
   reviewed label guide.
2. Expand the Other class with varied, representative synthetic cases while
   keeping expected labels fixed for this completed run.
3. Keep a separate holdout set for future prompt revisions; do not tune against
   the evaluation set and then present it as independent evidence.
4. If a future live evaluation is approved, record the run metadata and results
   without logging ticket content, credentials, or personal data.

