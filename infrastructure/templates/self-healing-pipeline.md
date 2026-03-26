# Self-Healing Pipeline Template

Use this template to build pipelines that detect failures early and recover automatically. The architecture has two layers: a preflight health check that runs before any work begins, and an auto-fix loop that catches and resolves errors during execution.

---

## Two-Layer Architecture

### Layer 1: Preflight Health Check

Runs before the pipeline starts. If any check fails, the pipeline halts before doing damage.

**Checks to include:**

- [ ] Dependencies exist and are the expected versions
- [ ] Required files and directories are present
- [ ] External services are reachable (APIs, databases, storage)
- [ ] Credentials and tokens are valid and not expired
- [ ] Disk space, memory, and compute are within acceptable thresholds
- [ ] Lock files or in-progress markers from previous runs are cleared

**Template:**

```
PREFLIGHT CHECKS FOR: ___________________________________
PIPELINE NAME:         ___________________________________
RUN FREQUENCY:         ___________________________________

Check 1: ________________________________________________
  Command/Script: ______________________________________
  Pass Condition: ______________________________________
  On Fail Action: [ ] Halt  [ ] Warn and Continue

Check 2: ________________________________________________
  Command/Script: ______________________________________
  Pass Condition: ______________________________________
  On Fail Action: [ ] Halt  [ ] Warn and Continue

Check 3: ________________________________________________
  Command/Script: ______________________________________
  Pass Condition: ______________________________________
  On Fail Action: [ ] Halt  [ ] Warn and Continue

(Add more checks as needed)
```

### Layer 2: Auto-Fix Loop

Wraps each pipeline step. When a step fails, the loop classifies the error, applies a fix, and retries.

**Loop structure:**

```
For each pipeline step:
  1. Execute the step
  2. If success -> move to next step
  3. If failure:
     a. Classify the error (see Error Classification below)
     b. Look up the fix for that error class
     c. Apply the fix
     d. Retry the step (up to max retries)
     e. If retries exhausted -> escalate
```

**Template:**

```
STEP NAME:       ___________________________________
MAX RETRIES:     ___________________________________
RETRY DELAY:     ___________________________________
ESCALATION PATH: ___________________________________

Known Error 1: _________________________________________
  Detection Pattern: __________________________________
  Auto-Fix Action:   __________________________________

Known Error 2: _________________________________________
  Detection Pattern: __________________________________
  Auto-Fix Action:   __________________________________

Fallback (unknown errors):
  Action: [ ] Log and skip  [ ] Log and halt  [ ] Notify team
```

---

## Error Classification

Every error the pipeline encounters should be classified into one of these categories. Each category has a different response strategy.

| Class | Description | Response | Example |
|-------|-------------|----------|---------|
| **Transient** | Temporary failures that resolve on retry | Retry with backoff | Network timeout, rate limit hit, service 503 |
| **Environmental** | Missing or misconfigured dependencies | Auto-fix then retry | Missing file, wrong permissions, expired token |
| **Data** | Bad input that the pipeline cannot process | Quarantine the input, continue with remaining items | Malformed record, schema mismatch, encoding error |
| **Logic** | Bug in the pipeline code itself | Halt and escalate immediately | Unhandled exception, assertion failure |
| **Resource** | System limits reached | Free resources or wait, then retry | Disk full, memory exhausted, too many open files |

**Fill in your pipeline's specific errors:**

```
ERROR MAP FOR PIPELINE: ___________________________________

Transient Errors:
  - Pattern: ____________________________________________
    Fix: ________________________________________________
  - Pattern: ____________________________________________
    Fix: ________________________________________________

Environmental Errors:
  - Pattern: ____________________________________________
    Fix: ________________________________________________
  - Pattern: ____________________________________________
    Fix: ________________________________________________

Data Errors:
  - Pattern: ____________________________________________
    Quarantine Location: ________________________________

Logic Errors:
  - Escalation Contact: ________________________________
  - Notification Channel: ______________________________

Resource Errors:
  - Pattern: ____________________________________________
    Fix: ________________________________________________
```

---

## Design Rules

Follow these rules when building any self-healing pipeline.

1. **Preflight before work.** Never skip the health check. A failed preflight is cheaper than a failed pipeline halfway through.

2. **Classify before fixing.** Do not apply the same retry logic to every error. A logic bug will not fix itself on the fifth attempt.

3. **Cap your retries.** Set a maximum retry count per step and per pipeline run. Infinite retries turn a failing pipeline into a resource drain.

4. **Log every recovery.** When the auto-fix loop resolves an error, log what failed, what fix was applied, and whether the retry succeeded. Silent recoveries hide systemic problems.

5. **Escalate what you cannot fix.** If the error class is unknown or retries are exhausted, stop and notify a human. Do not guess at fixes.

6. **Quarantine bad data.** Move problematic inputs to a quarantine location instead of deleting them. Someone will need to inspect them later.

7. **Make fixes idempotent.** Every auto-fix action must be safe to run multiple times. If the fix creates a file, it should check whether the file already exists first.

8. **Test the healing, not just the pipeline.** Write tests that deliberately trigger each error class and verify the pipeline recovers correctly.

---

## Adoption Checklist

Use this checklist when applying this template to a new pipeline.

- [ ] Defined all preflight checks with pass/fail conditions
- [ ] Mapped known errors to their classification and auto-fix actions
- [ ] Set retry limits for each step
- [ ] Set retry limits for the overall pipeline run
- [ ] Defined escalation paths for unrecoverable errors
- [ ] Created a quarantine location for bad data
- [ ] Verified all auto-fix actions are idempotent
- [ ] Wrote tests that trigger each error class
- [ ] Confirmed logging captures every recovery event
- [ ] Documented the pipeline in the team runbook
