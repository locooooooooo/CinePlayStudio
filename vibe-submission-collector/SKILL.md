---
name: vibe-submission-collector
description: Collect Vibe-a-thon contestant information and optional gift-shipping details through staged Chinese Q&A, isolate private fulfillment data, surface missing scoring evidence without blocking optional omissions, and generate a consistently organized submission folder. Use when contestants prepare or revise Top 30 materials, organizers need standardized packages or gift recipient data, or video and files over 10 MB must be represented by shareable links.
---

# Vibe Submission Collector

Create one standardized submission folder without requiring contestants to design their own document structure.

## Required resources

Read [references/submission-spec.md](references/submission-spec.md) completely before interviewing or editing a package. Read only the matching entries in [references/field-help.md](references/field-help.md) when a contestant asks what a field means or how to answer it. Use [scripts/submission_tool.py](scripts/submission_tool.py) to initialize, render, and validate folders.

## Workflow

Use an available Python 3 interpreter for the bundled script: prefer `python3`; if that command is unavailable, use `python`. Replace `<python>` in the commands below with the working command.

1. Ask for the output root and the organizer-provided submission ID. If no ID exists, derive a filesystem-safe ID from the team or project name and ask the contestant to confirm it.
2. Initialize the folder:

   ```bash
   <python> <skill-dir>/scripts/submission_tool.py init --root <output-root> --id <submission-id> [--title <optional-project-title>]
   ```

3. Interview in the rounds defined by the specification. Ask at most five questions per round. Accept rough notes, draft concise answers for the contestant, and require confirmation before recording claims as final.
4. Edit `00-submission.json` as the canonical source for submission and scoring information. Edit gift-delivery personal data only in `private/09-gift-shipping.json`. Preserve schema versions and keys. Use empty strings, empty arrays, or `null` for unavailable information; never invent evidence, users, test results, links, or technical usage. Certificate name, mobile number, participation mode, team-member certificate names when applicable, and mandatory declarations must be completed; other unanswered fields do not affect package eligibility.
5. For video, source archives, datasets, and other large files, request a stable cloud-drive or streaming URL with review access. Do not copy large files into the package.
6. Never request or store API keys, personal passwords, production credentials, or real-user data unrelated to the submission. If a Demo needs authentication, ask for a dedicated temporary test account and record it only in `private/08-test-access.md`. Store gift recipient name, phone, and shipping address only in `private/09-gift-shipping.json`. Never repeat either private file in generated summaries or review outputs.
7. Render all human-readable files after each completed interview round:

   ```bash
   <python> <skill-dir>/scripts/submission_tool.py render <submission-folder>
   ```

8. Run validation before handoff:

   ```bash
   <python> <skill-dir>/scripts/submission_tool.py validate <submission-folder>
   ```

9. Resolve every validation error. Validation errors are limited to package integrity, mandatory organizer-contact/certificate fields, and mandatory declarations. Report scoring-impact warnings explicitly, show the contestant a concise claim-and-link checklist, and obtain final confirmation.
10. Only after the contestant explicitly confirms the final submission information, send this fixed handoff reminder:

    > 请通过邮件将整理好的信息包发回给组织方：**gdghangzhou@163.com**。如果文件夹太大，可以先上传云网盘，然后发送链接。（请选手自行确保发送的链接可以公开访问）

    If a publicly accessible cloud-drive link is used, exclude the entire `private/` directory from that public package. Send `private/08-test-access.md` and `private/09-gift-shipping.json`, when present, to the organizer as separate email attachments or through a separate access-controlled link. Do not show the handoff reminder before final confirmation.

## Interview behavior

- Communicate in Chinese unless the contestant requests another language.
- Ask with field labels and direct questions only. Do not proactively display field definitions, explanatory notes, examples, or the help catalog.
- If the contestant asks what a field means, why it is needed, or how to fill it, look up only that field in `references/field-help.md`, explain it briefly, then resume the current question.
- Explain why a question affects review when the contestant is unsure.
- Prefer concrete prompts such as “法国首次支付用户” over broad prompts such as “海外用户”.
- Separate facts, contestant claims, and unvalidated assumptions.
- Do not collect Vibe Coding chat logs or Prompt histories. Prompt or Agent workflow evidence is optional only when it is itself a core technical mechanism.
- Do not use likes, views, favorites, or other propagation metrics as review evidence.
- Do not treat polished prose as evidence. Ask for a link, file, timecode, code path, screenshot, test record, or explicit “not yet validated”.
- Do not block handoff when scoring information is absent. Explain which judging dimensions cannot receive adequate evidence and preserve the omission as a warning.

## Output contract

Produce exactly the required filenames from the specification. Keep participant materials under one `<submission-id>/` folder. Do not create alternative summaries, README files, or renamed variants. `00-submission.json` is authoritative; all Markdown files are generated views.

Finish by reporting:

- absolute folder path;
- validation result;
- missing or unverified evidence;
- links that still need permission checks;
- whether a dedicated test account was supplied securely.

After this report and the contestant's explicit final confirmation, append the fixed email handoff reminder from Workflow step 10.
