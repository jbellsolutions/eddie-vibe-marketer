# Security Layers Template

Use this template to implement a 4-layer security architecture. Each layer operates independently so that a failure in one layer does not leave the system unprotected.

---

## Layer 1: Plugin Security Gate

Every plugin, extension, or third-party integration must pass through this gate before it is allowed to run.

### What This Layer Does

Validates plugins at install time and at runtime. Blocks anything that fails validation. Prevents unauthorized code from executing in the system.

### Checklist

- [ ] Every plugin has a manifest declaring its permissions, dependencies, and version
- [ ] Plugins are validated against an allowlist of approved packages and versions
- [ ] Plugins that request filesystem, network, or credential access are flagged for manual review
- [ ] Plugin signatures or checksums are verified before installation
- [ ] Runtime sandboxing limits what a plugin can access during execution
- [ ] Failed validations are logged with the plugin name, requested permissions, and reason for rejection
- [ ] A process exists to revoke a previously approved plugin if a vulnerability is discovered

### Fill-In Template

```
PLUGIN GATE CONFIGURATION
=========================

Allowlist Location:       ___________________________________
Approval Authority:       ___________________________________
Review Cadence:           ___________________________________

Allowed Permission Scopes:
  - [ ] Read filesystem (paths: ___________________________)
  - [ ] Write filesystem (paths: __________________________)
  - [ ] Network access (domains: __________________________)
  - [ ] Credential access (which: ________________________)
  - [ ] Execute subprocesses (allowed: ___________________)

Blocked by Default:
  - [ ] Arbitrary code execution
  - [ ] Access to credentials outside declared scope
  - [ ] Modification of core system files
  - [ ] Network access to undeclared domains

On Validation Failure:
  Action: [ ] Block silently  [ ] Block and notify  [ ] Quarantine for review
  Log To: ________________________________________________
  Notify: ________________________________________________
```

---

## Layer 2: Recurring Security Scans

Scheduled scans that run on a regular cadence to catch vulnerabilities, drift, and policy violations.

### What This Layer Does

Detects problems that develop over time: new CVEs in dependencies, configuration drift, expired credentials, and permission creep. Runs on a schedule rather than on-demand.

### Checklist

- [ ] Dependency vulnerability scans run at least weekly
- [ ] Configuration drift detection compares current state to the approved baseline
- [ ] Credential expiration checks flag tokens and keys approaching their expiry date
- [ ] Permission audits verify that access levels match the principle of least privilege
- [ ] Scan results are stored with timestamps for trend analysis
- [ ] Critical findings trigger immediate alerts, not just reports
- [ ] A remediation SLA is defined for each severity level

### Fill-In Template

```
RECURRING SCAN SCHEDULE
=======================

Scan 1: ________________________________________________
  Tool/Script:     ______________________________________
  Frequency:       ______________________________________
  Scope:           ______________________________________
  Severity Levels: [ ] Critical  [ ] High  [ ] Medium  [ ] Low
  Alert Channel:   ______________________________________
  Remediation SLA: Critical: ____  High: ____  Medium: ____

Scan 2: ________________________________________________
  Tool/Script:     ______________________________________
  Frequency:       ______________________________________
  Scope:           ______________________________________
  Severity Levels: [ ] Critical  [ ] High  [ ] Medium  [ ] Low
  Alert Channel:   ______________________________________
  Remediation SLA: Critical: ____  High: ____  Medium: ____

Scan 3: ________________________________________________
  Tool/Script:     ______________________________________
  Frequency:       ______________________________________
  Scope:           ______________________________________
  Severity Levels: [ ] Critical  [ ] High  [ ] Medium  [ ] Low
  Alert Channel:   ______________________________________
  Remediation SLA: Critical: ____  High: ____  Medium: ____

Baseline Document Location: ________________________________
Scan Results Archive:       ________________________________
```

---

## Layer 3: Critical File Protection

Specific files and directories that must not be modified, deleted, or replaced without explicit authorization.

### What This Layer Does

Monitors critical files for unauthorized changes. Uses checksums, file watchers, or version control hooks to detect modifications. Blocks or reverts changes that are not approved.

### Checklist

- [ ] Critical files are enumerated in a protected files manifest
- [ ] Each critical file has a stored checksum or hash that is verified on a schedule
- [ ] Write access to critical files is restricted to a minimal set of accounts or processes
- [ ] File modification events trigger real-time alerts
- [ ] Unauthorized changes are automatically reverted or flagged for immediate review
- [ ] The protected files manifest itself is protected from unauthorized modification
- [ ] Backup copies of critical files are stored in a separate location

### Fill-In Template

```
CRITICAL FILE MANIFEST
======================

File/Directory 1: __________________________________________
  Why Critical:       ______________________________________
  Allowed Modifiers:  ______________________________________
  Verification:       [ ] Checksum  [ ] File watcher  [ ] VCS hook
  Check Frequency:    ______________________________________
  On Unauthorized Change: [ ] Revert  [ ] Alert  [ ] Block write

File/Directory 2: __________________________________________
  Why Critical:       ______________________________________
  Allowed Modifiers:  ______________________________________
  Verification:       [ ] Checksum  [ ] File watcher  [ ] VCS hook
  Check Frequency:    ______________________________________
  On Unauthorized Change: [ ] Revert  [ ] Alert  [ ] Block write

File/Directory 3: __________________________________________
  Why Critical:       ______________________________________
  Allowed Modifiers:  ______________________________________
  Verification:       [ ] Checksum  [ ] File watcher  [ ] VCS hook
  Check Frequency:    ______________________________________
  On Unauthorized Change: [ ] Revert  [ ] Alert  [ ] Block write

Backup Location:      __________________________________________
Manifest Location:    __________________________________________
Manifest Protected By: _________________________________________
```

---

## Layer 4: System Health Monitoring

Continuous monitoring of the system's overall health to detect anomalies that the other layers might miss.

### What This Layer Does

Tracks system-level indicators: resource usage, process counts, network connections, error rates. Detects patterns that suggest a compromise or degradation even when no single event triggers an alert.

### Checklist

- [ ] CPU, memory, and disk usage are monitored with defined thresholds
- [ ] Unexpected processes or services are detected and flagged
- [ ] Network connections to unknown or unauthorized endpoints are logged
- [ ] Error rate baselines are established and spikes trigger alerts
- [ ] Log volume anomalies are detected (sudden drops may indicate log tampering)
- [ ] Health check endpoints for all services are polled on a regular cadence
- [ ] A runbook exists for each type of health alert

### Fill-In Template

```
SYSTEM HEALTH MONITORING
========================

Metric 1: ________________________________________________
  Normal Range:     ______________________________________
  Warning Threshold: _____________________________________
  Critical Threshold: ____________________________________
  Alert Channel:    ______________________________________
  Runbook Link:     ______________________________________

Metric 2: ________________________________________________
  Normal Range:     ______________________________________
  Warning Threshold: _____________________________________
  Critical Threshold: ____________________________________
  Alert Channel:    ______________________________________
  Runbook Link:     ______________________________________

Metric 3: ________________________________________________
  Normal Range:     ______________________________________
  Warning Threshold: _____________________________________
  Critical Threshold: ____________________________________
  Alert Channel:    ______________________________________
  Runbook Link:     ______________________________________

Health Check Endpoints:
  Service: ________________  URL: ________________________  Interval: ____
  Service: ________________  URL: ________________________  Interval: ____
  Service: ________________  URL: ________________________  Interval: ____

Anomaly Detection:
  Baseline Period:     ______________________________________
  Sensitivity:         [ ] Low (fewer false positives)
                       [ ] Medium
                       [ ] High (fewer missed detections)
  Review Cadence:      ______________________________________
```

---

## Adoption Checklist

Use this checklist when rolling out the 4-layer security architecture to a new system.

- [ ] **Layer 1:** Plugin allowlist created and approved
- [ ] **Layer 1:** Validation logic implemented and tested with a known-bad plugin
- [ ] **Layer 2:** Scan schedule defined and tools configured
- [ ] **Layer 2:** Remediation SLAs documented and agreed upon by the team
- [ ] **Layer 3:** Critical file manifest created and checksums stored
- [ ] **Layer 3:** File protection mechanism deployed and tested with a simulated unauthorized change
- [ ] **Layer 4:** Health metrics, thresholds, and alert channels configured
- [ ] **Layer 4:** Runbooks written for each alert type
- [ ] All four layers tested independently to verify they catch their target threats
- [ ] Alert fatigue assessed: thresholds tuned to minimize false positives
- [ ] Incident response plan updated to reference all four layers
- [ ] Team trained on how to respond to alerts from each layer
