# RELEASING

> Patch and hotfix workflow for the `7.6.3` and `7.10.6` product line

| Version      | Base Branch    | Purpose              | End of Support | Notes                                       |
|--------------|----------------|----------------------|----------------|---------------------------------------------|
| 7.10.6 (LTS) | `master`       | Active main version  | 31st Dec 2026  | All standard hotfixes                       |
| 7.6.3        | `master-7.6.3` | Security maintenance | —              | Only security patches, same hotfix workflow |


**Purpose**

This document is intended for all developers and release managers involved in patch and hotfix workflows.

## Scope and naming

- This document describes how to produce patch builds like `7.10.6-59` or `7.6.3-XX`
- Patches are managed by [swamp](https://wf.open-xchange.com/) and each patch workflow has a unique swamp ID
- Branches created for a swamp workflow always follow the naming convention `hotfix-<swamp-id>`
- Versioning follows the pattern major.minor.patch-buildnumber (for example: `7.10.6-59`)
- The current active main version line is `7.10.6`
- The older maintenance line `7.6.3` only receives security patches and lives in the branch `master-7.6.3`

## Roles

- **@markus.wagner** starts and QA-tests the patch workflow in swamp and handles release notes
- **@marcus.klein** creates and maintains the `hotfix-<id>` branch, coordinates release preparation, merges after release
- Developers provide backports via `integration/master` before cherry-picking them into the `hotfix` branch

## Protected branches

- `master` represents the most important version (currently `7.10.6`) and must not be directly modified by developers
- `integration/master` acts as a "develop" branch and mainly contains changes or backports intended for an upcoming hotfix
- A read-only [merge request](https://gitlab.open-xchange.com/frontend/core/-/merge_requests/1171) from `integration/master` to `master` exists only for visibility of upcoming changes. It is never merged, only rebased regularly

## High-level flow

- The patch workflow is started in *swamp* by **@markus.wagner**, including references to all issues that must be backported
- A comment referencing the swamp workflow is added to each related JIRA or GitLab issue
- The release management team (**@marcus.klein**) creates a new branch `hotfix-<swamp-id>` from the correct base branch:
  - from `master` for **7.10.6**
  - from `master-7.6.3` for **7.6.3**
- Developers first land fixes or backports in `integration/master`
- Once merged there, the change is cherry-picked (with provenance) into the corresponding `hotfix-<swamp-id>` branch
- A read-only merge request is opened from `hotfix-<swamp-id>` to the base branch (`master` or `master-7.6.3`)
- The merge request description contains a "must include" checklist linking all related issues. Example [merge request](https://gitlab.open-xchange.com/frontend/core/-/merge_requests/1318)
- Each checkbox is marked once the corresponding change has been cherry-picked into the branch
- When all items are included, **@markus.wagner** performs QA testing on the hotfix build
- After QA sign-off, **@marcus.klein** prepares and publishes the release
- After release, **@marcus.klein** merges the `hotfix-<swamp-id>` branch and the related merge request closes automatically
- A developer then rebases `integration/master` on top of the updated `master` branch

## Merge requests and visibility

### `integration/master`

> targets `master`

- Exists only for visibility of upcoming hotfix work and backlog
- Never merged, only rebased regularly to keep it current
- Serves as an overview of what is planned to be part of a future hotfix

### `hotfix-<swamp-id>`

> targets `master` or `master-7.6.3`

- Read-only merge request containing a checklist of "must include" issues
- Each item in the list corresponds to a backported or fixed issue
- Only cherry-picked commits from `integration/master` are allowed
- No direct commits are permitted
- Once all issues are included and QA is completed, the release is prepared and tagged

## QA and release

- **@markus.wagner** executes QA tests based on the `hotfix-<swamp-id>` branch build
- Any issue found during QA must follow the standard flow:
  - Fix in `integration/master`
  - Cherry-pick into the hotfix branch
  - Mark as included in the merge request checklist
- After successful QA, **@marcus.klein** prepares and publishes the patch release using the next available build number (for example, `7.10.6-59`)
- **@markus.wagner** handles release notes based on the swamp workflow contents

## Post-release tasks

- **@marcus.klein** merges the `hotfix-<swamp-id>` branch into its base branch (`master` or `master-7.6.3`)
- The merge request closes automatically after merge
- A developer rebases `integration/master` on top of the updated `master`
- The visibility merge request (`integration/master → master`) is rebased to reflect the latest backlog

## Quality gates

- CI must succeed on both `integration/master` and `hotfix-<swamp-id>`
- All "must include" items checked in the hotfix merge request
- QA approval from **@markus.wagner**
- Release published by **@marcus.klein**
- Release notes completed and linked to the swamp workflow


