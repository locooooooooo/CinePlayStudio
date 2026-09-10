# Vibe-a-thon submission package specification

## Contents

1. Package contract
2. Requiredness policy
3. Interview rounds
4. Evidence and security rules
5. Completion rules
6. Confirmed-submission handoff

## 1. Package contract

Every new package uses schema `vibe-a-thon-submission/v3`:

```text
<submission-id>/
├── 00-submission.json
├── 01-overview.md
├── 02-user-problem.md
├── 03-product-demo.md
├── 04-google-technology.md
├── 05-market-localization.md
├── 06-innovation.md
├── 07-declarations.md
├── private/
│   ├── 08-test-access.md
│   └── 09-gift-shipping.json
└── evidence/
    ├── user-research/
    ├── technical/
    └── localization/
```

Use `00-submission.json` as the canonical source. Regenerate the numbered Markdown files with the bundled script.

Treat both files under `private/` as restricted personal information. Share test access only with the organizing committee and assigned judges. Share gift-shipping information only with organizers responsible for fulfillment; do not expose it to judges or public showcase materials.

## 2. Requiredness policy

These organizer-contact and certificate fields block submission:

- contestant name exactly as it should appear on the certificate;
- mobile number used by organizers to contact the contestant;
- whether the entry is individual or team-based;
- all team-member names exactly as they should appear on certificates, when the entry is team-based.

These contestant declarations also block submission:

- whether the work existed before the contest;
- what was newly created during the contest;
- originality confirmation;
- consent for judges to access and test the work.

All other contestant-facing fields are optional. Missing information must not block handoff or cause automatic disqualification. Missing scoring evidence produces a scoring-impact warning. Missing optional administrative information produces an administrative warning.

Schema version and submission ID remain technically required so the two Skills can exchange and aggregate packages reliably.

## 3. Interview rounds

Ask no more than five questions per round. Allow “暂不提供” only for optional questions. Do not show field explanations unless the contestant explicitly asks. Summarize and confirm each round before continuing.

### Round A: contestant and project information

1. Contestant name exactly as it should appear on a certificate and mobile number; optionally collect WeChat ID and email.
2. Whether this is an individual or team entry. For a team entry, collect every team-member name exactly as it should appear on certificates.
3. Optional gift-shipping recipient name, phone, and full address.
4. Track (`真`, `善`, or `美`), current status, and one-sentence description in the form “为谁，在什么场景，解决什么问题”.
5. Target countries or regions and Xiaohongshu post URL.

Project/product title and team name may be recorded when supplied but are not required.

### Round B: user problem

1. Specific target user.
2. Typical usage scenario.
3. Current user workaround.
4. Concrete shortcomings of the current approach.
5. Core user pain points; optionally add interviews, feedback, public sources, or other evidence.

No user evidence blocks submission. Flag its absence for the external judge.

### Round C: solution and functioning Demo

1. Solution summary, user value, and complete user flow.
2. Up to five core features.
3. Online Demo or runnable-file cloud URL. If released, record the distribution channel and exact product name, such as App Store or Xiaohongshu.
4. Access method, recommended browser/device/environment, expected review duration, and three to five steps with expected results.
5. Known limitations, fallback URL, and availability confirmation.

If login is required, request a dedicated temporary account, temporary password, validity period, and login instructions.

### Round D: Google technology

For each technology actually used, collect:

- Google product or technology name;
- specific model or capability;
- product function supported;
- input, processing, and output;
- core or supporting role;
- selection reason;
- impact if removed;
- code, architecture, screenshot, video timecode, or Demo evidence location.

### Round E: innovation, overseas viability, and localization

1. At least one technical innovation when available.
2. At least one product or experience innovation when available.
3. First planned overseas market, rationale, initial user-acquisition route, usage conditions, and main barriers.
4. Target culture, local habits, user emotions or constraints, and adaptations beyond translation.
5. Localization research or test evidence and changes made after testing.

For each innovation, collect title, common approach, difference, actual effect, and evidence location.

### Round F: video and declarations

1. A 2–5 minute video URL containing the Demo, user problem, Google technology, innovation, and localization explanation.
2. Whether the work existed before the contest.
3. What was newly created during the contest.
4. Originality confirmation.
5. Consent for judges to access and test the submitted work.

Video section timecodes are optional.

## 4. Evidence and security rules

- Do not collect Vibe Coding chat logs or Prompt histories. Prompt or Agent workflow evidence is optional only when it is itself a core technical mechanism.
- Do not collect or score likes, views, favorites, shares, or other propagation metrics.
- Submit videos, source archives, datasets, install packages, and every file larger than 10 MB as a stable streaming, store, or cloud-drive URL.
- Never collect API keys, production credentials, personal passwords, or real-user personal data.
- Use only a dedicated temporary test account for restricted Demos. Never repeat its secret in generated summaries.
- Store gift recipient name, phone, and full shipping address only in `private/09-gift-shipping.json`. Never include them in `00-submission.json`, generated Markdown, AI evidence summaries, judge scorecards, or ranking CSV files.
- Distinguish contestant claims from verified evidence and explicitly preserve “not provided” or “not tested”.

## 5. Completion rules

Validation errors block handoff only for:

- invalid or unsupported package schema;
- missing submission ID;
- missing contestant certificate name;
- missing mobile number;
- unanswered individual/team participation mode;
- missing team-member certificate names when team participation is selected;
- unanswered `existed_before_contest` declaration;
- missing description of work created during the contest;
- originality not confirmed;
- judge access and testing not authorized.

Everything else is a warning. Missing scoring material may reduce the relevant score; missing optional contact or gift information is administrative only. Examples include missing user problem, Demo, video, Google technology evidence, innovation, overseas-market reasoning, localization, invalid optional URLs, incomplete Demo steps, or files larger than 10 MB.

## 6. Confirmed-submission handoff

Do not show the handoff reminder during collection, drafting, validation, or correction. Show it only after the contestant has explicitly confirmed that the submission information is final:

> 请通过邮件将整理好的信息包发回给组织方：**gdghangzhou@163.com**。如果文件夹太大，可以先上传云网盘，然后发送链接。（请选手自行确保发送的链接可以公开访问）

When a cloud-drive link is used, the contestant must verify that the main submission package can be opened without requesting additional permission. Because the link may be publicly accessible, the uploaded public package must exclude the entire `private/` directory. When either restricted file is present, send `private/08-test-access.md` and `private/09-gift-shipping.json` separately to the organizer as email attachments or through a separate access-controlled link. Never publish either restricted file through the public submission link.
