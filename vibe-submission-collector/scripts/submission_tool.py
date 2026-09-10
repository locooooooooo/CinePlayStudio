#!/usr/bin/env python3
"""Initialize, render, and validate Vibe-a-thon submission packages."""

from __future__ import annotations

import argparse
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse

SCHEMA = "vibe-a-thon-submission/v3"
LEGACY_SCHEMAS = {"vibe-a-thon-submission/v1", "vibe-a-thon-submission/v2"}
REQUIRED_MARKDOWN = [
    "01-overview.md",
    "02-user-problem.md",
    "03-product-demo.md",
    "04-google-technology.md",
    "05-market-localization.md",
    "06-innovation.md",
    "07-declarations.md",
]


def now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def valid_url(value: str) -> bool:
    parsed = urlparse(value or "")
    return parsed.scheme in {"http", "https"} and bool(parsed.netloc)


def blank_submission(submission_id: str, title: str) -> dict:
    return {
        "schema_version": SCHEMA,
        "submission_id": submission_id,
        "updated_at": now_iso(),
        "basic": {
            "title": title,
            "team_name": "",
            "track": "",
            "one_liner": "",
            "contestant_name_certificate": "",
            "has_team": None,
            "team_member_names_certificate": [],
            "contact": {"name": "", "email": "", "phone": "", "wechat": ""},
            "members": [],
            "target_markets": [],
            "languages": [],
            "status": "",
            "xiaohongshu_url": "",
        },
        "problem": {
            "target_users": "",
            "scenario": "",
            "current_workaround": "",
            "pain_points": [],
            "evidence_summary": "",
            "evidence_links": [],
            "research_count": 0,
            "representative_feedback": "",
            "unvalidated_assumptions": [],
        },
        "solution": {"summary": "", "user_value": "", "user_flow": [], "core_features": []},
        "demo": {
            "url": "",
            "access_method": "",
            "recommended_environment": "",
            "experience_steps": [],
            "expected_duration_minutes": None,
            "known_issues": [],
            "fallback_download_url": "",
            "published_channel": "",
            "published_product_name": "",
            "support_contact": "",
            "availability_confirmed": False,
            "automated_testing_consent": False,
            "access_restricted": False,
            "private_access_file": "private/08-test-access.md",
        },
        "video": {
            "url": "",
            "duration_minutes": None,
            "contents_confirmed": {"demo": False, "user_problem": False, "google_technology": False, "innovation": False, "localization": False},
            "timecodes": {"problem": "", "demo": "", "google_technology": "", "innovation": "", "localization": ""},
        },
        "google_technology": [],
        "technical": {
            "architecture_file": "",
            "repository_url": "",
            "commit_id": "",
            "code_evidence_paths": [],
            "deployment_notes": "",
            "dependencies": [],
            "confidentiality_notes": "",
        },
        "innovation": {"technical": [], "product_experience": []},
        "market": {
            "first_market": "",
            "market_rationale": "",
            "user_acquisition": "",
            "usage_conditions": "",
            "barriers": [],
            "cost_range": "",
            "social_impact_path": "",
            "impact_metrics": [],
            "six_month_plan": "",
        },
        "localization": {
            "target_culture": "",
            "habits": [],
            "user_concerns": [],
            "adaptations": [],
            "evidence": [],
            "tested_with_local_users": False,
            "test_count": 0,
            "changes_after_testing": "",
        },
        "declarations": {
            "existed_before_contest": None,
            "new_work_during_contest": "",
            "originality_confirmed": False,
            "review_access_consent": False,
        },
        "attachments": [],
    }


def load_submission(folder: Path) -> dict:
    path = folder / "00-submission.json"
    if not path.is_file():
        raise ValueError(f"missing {path}")
    data = json.loads(path.read_text(encoding="utf-8"))
    if data.get("schema_version") in LEGACY_SCHEMAS | {SCHEMA}:
        basic = data.setdefault("basic", {})
        basic.setdefault("contestant_name_certificate", basic.get("contact", {}).get("name", ""))
        basic.setdefault("team_member_names_certificate", [
            member.get("name", "") for member in basic.get("members", []) if isinstance(member, dict) and member.get("name")
        ])
        basic.setdefault("has_team", bool(basic.get("team_member_names_certificate")))
        demo = data.setdefault("demo", {})
        demo.setdefault("published_channel", "")
        demo.setdefault("published_product_name", "")
        video = data.setdefault("video", {})
        video.setdefault("contents_confirmed", {"demo": False, "user_problem": False, "google_technology": False, "innovation": False, "localization": False})
        if data.get("schema_version") in LEGACY_SCHEMAS:
            data["schema_version"] = SCHEMA
    return data


def bullets(values, empty="未提供") -> str:
    if not values:
        return f"- {empty}"
    result = []
    for value in values:
        if isinstance(value, dict):
            result.append(f"- {json.dumps(value, ensure_ascii=False)}")
        else:
            result.append(f"- {value}")
    return "\n".join(result)


def text(value, empty="未提供") -> str:
    if value is None or value == "":
        return empty
    if isinstance(value, bool):
        return "是" if value else "否"
    return str(value)


def render(folder: Path, data: dict) -> None:
    basic, problem, solution = data["basic"], data["problem"], data["solution"]
    demo, video = data["demo"], data["video"]
    tech, market, loc = data["technical"], data["market"], data["localization"]
    decl = data["declarations"]

    overview = f"""# 作品概览

- 作品编号：{text(data['submission_id'])}
- 作品名称：{text(basic['title'])}
- 团队名称：{text(basic['team_name'])}
- 选手姓名（获奖证书）：{text(basic['contestant_name_certificate'])}
- 参赛形式：{'团队参赛' if basic['has_team'] is True else '个人参赛' if basic['has_team'] is False else '未提供'}
- 团队成员姓名（获奖证书）：{', '.join(basic['team_member_names_certificate']) or '未提供'}
- 赛道：{text(basic['track'])}
- 当前状态：{text(basic['status'])}
- 一句话介绍：{text(basic['one_liner'])}
- 目标市场：{', '.join(basic['target_markets']) or '未提供'}
- 产品语言：{', '.join(basic['languages']) or '未提供'}
- 小红书链接：{text(basic['xiaohongshu_url'])}

## 团队成员

{bullets(basic['members'])}

## 联系人

- 姓名：{text(basic['contact']['name'])}
- 邮箱：{text(basic['contact']['email'])}
- 手机：{text(basic['contact']['phone'])}
- 微信：{text(basic['contact']['wechat'])}
"""
    user_problem = f"""# 用户问题

## 目标用户

{text(problem['target_users'])}

## 使用场景

{text(problem['scenario'])}

## 当前解决方式

{text(problem['current_workaround'])}

## 具体痛点

{bullets(problem['pain_points'])}

## 问题证据

{text(problem['evidence_summary'])}

{bullets(problem['evidence_links'], '未提供证据链接')}

- 访谈或测试人数：{text(problem['research_count'], '0')}
- 代表性反馈：{text(problem['representative_feedback'])}

## 尚未验证的假设

{bullets(problem['unvalidated_assumptions'])}
"""
    feature_lines = []
    for index, feature in enumerate(solution["core_features"], 1):
        feature_lines.append(
            f"### {index}. {text(feature.get('name'))}\n\n"
            f"- 解决的问题：{text(feature.get('problem'))}\n"
            f"- 输入：{text(feature.get('input'))}\n"
            f"- 系统处理：{text(feature.get('processing'))}\n"
            f"- 输出：{text(feature.get('output'))}\n"
            f"- 当前状态：{text(feature.get('runnable_status'))}\n"
            f"- 证据位置：{text(feature.get('evidence_location'))}"
        )
    step_lines = []
    for index, step in enumerate(demo["experience_steps"], 1):
        step_lines.append(f"{index}. {text(step.get('action'))}\n   - 预期结果：{text(step.get('expected_result'))}")
    timecodes = video["timecodes"]
    product_demo = f"""# 产品与 Demo

## 解决方案

{text(solution['summary'])}

## 用户价值

{text(solution['user_value'])}

## 用户流程

{bullets(solution['user_flow'])}

## 核心功能

{chr(10).join(feature_lines) or '未提供'}

## Demo

- Demo链接：{text(demo['url'])}
- 访问方式：{text(demo['access_method'])}
- 推荐环境：{text(demo['recommended_environment'])}
- 预计体验时长：{text(demo['expected_duration_minutes'])} 分钟
- 备用下载链接：{text(demo['fallback_download_url'])}
- 已发布渠道：{text(demo['published_channel'])}
- 已发布产品名称：{text(demo['published_product_name'])}
- 技术支持联系人：{text(demo['support_contact'])}
- 受限访问：{text(demo['access_restricted'])}
- 测试账号文件：{text(demo['private_access_file'])}

### 体验步骤

{chr(10).join(step_lines) or '未提供'}

### 已知问题

{bullets(demo['known_issues'])}

## 演示视频

- 视频链接：{text(video['url'])}
- 时长：{text(video['duration_minutes'])} 分钟
- 包含 Demo 演示：{text(video['contents_confirmed']['demo'])}
- 包含用户问题：{text(video['contents_confirmed']['user_problem'])}
- 包含 Google 技术说明：{text(video['contents_confirmed']['google_technology'])}
- 包含创新点说明：{text(video['contents_confirmed']['innovation'])}
- 包含本地化说明：{text(video['contents_confirmed']['localization'])}
- 用户问题：{text(timecodes['problem'])}
- Demo：{text(timecodes['demo'])}
- Google技术：{text(timecodes['google_technology'])}
- 创新点：{text(timecodes['innovation'])}
- 本地化：{text(timecodes['localization'])}
"""
    google_lines = []
    for index, item in enumerate(data["google_technology"], 1):
        google_lines.append(
            f"## {index}. {text(item.get('name'))}\n\n"
            f"- 具体能力或模型：{text(item.get('capability'))}\n"
            f"- 对应功能：{text(item.get('feature'))}\n"
            f"- 输入：{text(item.get('input'))}\n"
            f"- 处理：{text(item.get('processing'))}\n"
            f"- 输出：{text(item.get('output'))}\n"
            f"- 核心程度：{text(item.get('role'))}\n"
            f"- 选型原因：{text(item.get('selection_reason'))}\n"
            f"- 移除后的影响：{text(item.get('removal_impact'))}\n"
            f"- 证据位置：{text(item.get('evidence_location'))}"
        )
    google_technology = f"""# Google 技术与实现证据

{chr(10).join(google_lines) or '未提供 Google 技术记录'}

## 技术材料

- 架构图：{text(tech['architecture_file'])}
- 代码仓库：{text(tech['repository_url'])}
- 评审版本：{text(tech['commit_id'])}
- 部署说明：{text(tech['deployment_notes'])}
- 保密限制：{text(tech['confidentiality_notes'])}

### 核心代码或证据位置

{bullets(tech['code_evidence_paths'])}

### 外部依赖

{bullets(tech['dependencies'])}
"""
    market_localization = f"""# 出海市场、社会价值与本地化

## 出海落地

- 首个市场：{text(market['first_market'])}
- 市场选择原因：{text(market['market_rationale'])}
- 首批用户获取方式：{text(market['user_acquisition'])}
- 使用条件：{text(market['usage_conditions'])}
- 成本范围：{text(market['cost_range'])}
- 六个月计划：{text(market['six_month_plan'])}

### 主要障碍

{bullets(market['barriers'])}

## 社会价值

{text(market['social_impact_path'])}

### 影响指标

{bullets(market['impact_metrics'])}

## 本地化

- 目标文化或地区：{text(loc['target_culture'])}
- 是否经过当地用户测试：{text(loc['tested_with_local_users'])}
- 测试人数：{text(loc['test_count'], '0')}
- 测试后的修改：{text(loc['changes_after_testing'])}

### 当地习惯

{bullets(loc['habits'])}

### 用户顾虑

{bullets(loc['user_concerns'])}

### 非翻译型适配

{bullets(loc['adaptations'])}

### 本地化证据

{bullets(loc['evidence'])}
"""
    innovation_lines = []
    for label, values in [("技术创新", data["innovation"]["technical"]), ("产品与体验创新", data["innovation"]["product_experience"])]:
        innovation_lines.append(f"## {label}")
        if not values:
            innovation_lines.append("\n未提供")
        for index, item in enumerate(values, 1):
            innovation_lines.append(
                f"\n### {index}. {text(item.get('title'))}\n\n"
                f"- 常见做法：{text(item.get('common_approach'))}\n"
                f"- 本作品的不同：{text(item.get('difference'))}\n"
                f"- 实际效果：{text(item.get('effect'))}\n"
                f"- 证据位置：{text(item.get('evidence_location'))}"
            )
    declarations = f"""# 原创性与合规声明

- 赛前已存在：{text(decl['existed_before_contest'])}
- 比赛期间新增：{text(decl['new_work_during_contest'])}
- 原创性确认：{text(decl['originality_confirmed'])}
- 评委访问和测试授权：{text(decl['review_access_consent'])}

## 小型附件索引

{bullets(data['attachments'])}
"""
    outputs = {
        "01-overview.md": overview,
        "02-user-problem.md": user_problem,
        "03-product-demo.md": product_demo,
        "04-google-technology.md": google_technology,
        "05-market-localization.md": market_localization,
        "06-innovation.md": "# 创新说明\n\n" + "\n".join(innovation_lines) + "\n",
        "07-declarations.md": declarations,
    }
    for filename, content in outputs.items():
        (folder / filename).write_text(content.strip() + "\n", encoding="utf-8")


def validate(folder: Path, data: dict) -> dict:
    errors, warnings = [], []

    def missing(value) -> bool:
        return value is None or value == "" or value == []

    def warn_missing(value, label):
        if missing(value):
            warnings.append(f"missing scoring information: {label}")

    if missing(data.get("schema_version")):
        errors.append("missing schema_version")
    if data.get("schema_version") != SCHEMA:
        errors.append(f"unsupported schema_version: {data.get('schema_version')}")
    if missing(data.get("submission_id")):
        errors.append("missing submission_id")

    basic = data.get("basic", {})
    warn_missing(basic.get("contact", {}).get("wechat"), "微信号")
    if missing(basic.get("contestant_name_certificate")):
        errors.append("missing basic.contestant_name_certificate")
    if missing(basic.get("contact", {}).get("phone")):
        errors.append("missing basic.contact.phone")
    if not isinstance(basic.get("has_team"), bool):
        errors.append("basic.has_team must be answered true or false")
    elif basic.get("has_team") and missing(basic.get("team_member_names_certificate")):
        errors.append("missing basic.team_member_names_certificate for team entry")
    elif not basic.get("has_team") and basic.get("team_member_names_certificate"):
        warnings.append("inconsistent administrative information: 个人参赛不应填写团队成员证书姓名")
    warn_missing(basic.get("track"), "参赛赛道")
    if basic.get("track") and basic["track"] not in {"真", "善", "美"}:
        warnings.append("invalid scoring information: 参赛赛道应为真、善或美")
    warn_missing(basic.get("status"), "当前状态")
    warn_missing(basic.get("one_liner"), "一句话介绍")
    warn_missing(basic.get("contact", {}).get("email"), "邮箱")
    warn_missing(basic.get("target_markets"), "目标国家或地区")
    warn_missing(basic.get("xiaohongshu_url"), "小红书作品链接")
    if basic.get("xiaohongshu_url") and not valid_url(basic["xiaohongshu_url"]):
        warnings.append("invalid optional URL: 小红书作品链接")

    contact = basic.get("contact", {})
    if not contact.get("email") and not contact.get("wechat"):
        warnings.append("missing administrative information: 邮箱或微信号")

    problem = data.get("problem", {})
    warn_missing(problem.get("target_users"), "具体目标用户")
    warn_missing(problem.get("scenario"), "典型使用场景")
    warn_missing(problem.get("current_workaround"), "用户当前解决方式")
    warn_missing(problem.get("pain_points"), "核心用户痛点和现有方式不足")
    if not problem.get("evidence_summary") and not problem.get("evidence_links"):
        warnings.append("scoring evidence missing: 用户问题证据")

    solution = data.get("solution", {})
    warn_missing(solution.get("summary"), "解决方案概述")
    warn_missing(solution.get("user_value"), "用户价值")
    warn_missing(solution.get("user_flow"), "完整用户流程")
    warn_missing(solution.get("core_features"), "核心功能")

    demo = data.get("demo", {})
    warn_missing(demo.get("url"), "Demo或可运行文件链接")
    if demo.get("url") and not valid_url(demo["url"]):
        warnings.append("invalid optional URL: Demo链接")
    if demo.get("published_channel") and not demo.get("published_product_name"):
        warnings.append("incomplete scoring information: 已发布渠道缺少产品名称")
    if demo.get("published_product_name") and not demo.get("published_channel"):
        warnings.append("incomplete scoring information: 已发布产品缺少发布渠道")
    warn_missing(demo.get("access_method"), "Demo访问方式")
    warn_missing(demo.get("recommended_environment"), "推荐运行环境")
    warn_missing(demo.get("expected_duration_minutes"), "预计体验时间")
    steps = demo.get("experience_steps", [])
    if not steps:
        warnings.append("missing scoring information: Demo体验步骤")
    elif not 3 <= len(steps) <= 5:
        warnings.append("incomplete scoring information: Demo体验步骤建议为3至5步")
    for index, step in enumerate(steps, 1):
        if missing(step.get("action")):
            warnings.append(f"incomplete scoring information: Demo第{index}步缺少操作")
        if missing(step.get("expected_result")):
            warnings.append(f"incomplete scoring information: Demo第{index}步缺少预期结果")
    if not demo.get("availability_confirmed"):
        warnings.append("missing scoring information: Demo评审期可用确认")
    if demo.get("access_restricted") and not (folder / demo.get("private_access_file", "")).is_file():
        warnings.append("restricted Demo has no private test-access file")
    if not demo.get("fallback_download_url"):
        warnings.append("missing scoring information: 备用Demo或下载链接")
    elif not valid_url(demo["fallback_download_url"]):
        warnings.append("invalid optional URL: 备用Demo或下载链接")

    video = data.get("video", {})
    warn_missing(video.get("url"), "2至5分钟演示视频链接")
    if video.get("url") and not valid_url(video["url"]):
        warnings.append("invalid optional URL: 演示视频链接")
    duration = video.get("duration_minutes")
    if duration is None:
        warnings.append("missing scoring information: 演示视频时长")
    elif not 2 <= duration <= 5:
        warnings.append("incomplete scoring information: 演示视频应为2至5分钟")
    video_contents = video.get("contents_confirmed", {})
    for key, label in [("demo", "Demo演示"), ("user_problem", "用户问题"), ("google_technology", "Google技术说明"), ("innovation", "创新点说明"), ("localization", "本地化说明")]:
        if not video_contents.get(key):
            warnings.append(f"missing scoring information: 视频未确认包含{label}")

    google_items = data.get("google_technology", [])
    if not google_items:
        warnings.append("missing scoring information: Google技术应用")
    required_google = ["name", "capability", "feature", "input", "processing", "output", "role", "selection_reason", "removal_impact", "evidence_location"]
    for index, item in enumerate(google_items, 1):
        for key in required_google:
            if missing(item.get(key)):
                warnings.append(f"incomplete scoring information: Google技术第{index}项缺少{key}")
        if item.get("role") and item["role"] not in {"核心", "支撑"}:
            warnings.append(f"invalid scoring information: Google技术第{index}项角色应为核心或支撑")

    innovation = data.get("innovation", {})
    warn_missing(innovation.get("technical"), "技术创新")
    warn_missing(innovation.get("product_experience"), "产品与体验创新")

    market = data.get("market", {})
    warn_missing(market.get("first_market"), "首个计划进入的市场")
    warn_missing(market.get("market_rationale"), "市场选择原因")
    warn_missing(market.get("user_acquisition"), "首批用户获取方式")
    warn_missing(market.get("usage_conditions"), "用户使用条件")
    warn_missing(market.get("barriers"), "主要落地障碍")

    localization = data.get("localization", {})
    warn_missing(localization.get("target_culture"), "目标文化或地区")
    warn_missing(localization.get("habits"), "当地用户习惯")
    warn_missing(localization.get("user_concerns"), "当地用户情绪、顾虑或限制")
    warn_missing(localization.get("adaptations"), "语言翻译之外的产品适配")
    if not localization.get("tested_with_local_users"):
        warnings.append("scoring evidence missing: 未经过当地用户测试")
    if not localization.get("evidence"):
        warnings.append("scoring evidence missing: 本地化研究或测试证据")

    declarations = data.get("declarations", {})
    if not isinstance(declarations.get("existed_before_contest"), bool):
        errors.append("declarations.existed_before_contest must be answered true or false")
    if missing(declarations.get("new_work_during_contest")):
        errors.append("missing declarations.new_work_during_contest")
    if declarations.get("originality_confirmed") is not True:
        errors.append("declarations.originality_confirmed must be true")
    if declarations.get("review_access_consent") is not True:
        errors.append("declarations.review_access_consent must be true")

    for path in folder.rglob("*"):
        if path.is_file() and path.stat().st_size > 10 * 1024 * 1024:
            warnings.append(f"large local file should be a cloud link: {path.relative_to(folder)}")

    shipping_path = folder / "private/09-gift-shipping.json"
    if not shipping_path.is_file():
        warnings.append("missing administrative information: 礼品邮寄信息文件")
    else:
        try:
            shipping = json.loads(shipping_path.read_text(encoding="utf-8"))
            for key, label in [("recipient_name", "礼品收件人姓名"), ("phone", "礼品收件电话"), ("address", "礼品邮寄地址")]:
                if missing(shipping.get(key)):
                    warnings.append(f"missing administrative information: {label}")
        except json.JSONDecodeError:
            warnings.append("invalid administrative information: 礼品邮寄信息文件不是有效JSON")
    return {"schema_version": SCHEMA, "submission_id": data.get("submission_id"), "valid": not errors, "errors": errors, "warnings": warnings}


def command_init(args) -> int:
    if not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9._-]{1,63}", args.id):
        raise ValueError("submission ID must be 2-64 filesystem-safe characters")
    folder = Path(args.root).expanduser().resolve() / args.id
    if folder.exists() and any(folder.iterdir()):
        raise ValueError(f"refusing to overwrite non-empty folder: {folder}")
    folder.mkdir(parents=True, exist_ok=True)
    for subdir in ["private", "evidence/user-research", "evidence/technical", "evidence/localization"]:
        (folder / subdir).mkdir(parents=True, exist_ok=True)
    data = blank_submission(args.id, args.title)
    (folder / "00-submission.json").write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (folder / "private/08-test-access.md").write_text(
        "# 评审测试账号（敏感）\n\n"
        "> 仅填写专用临时测试账号。禁止填写 API Key、个人密码、生产凭据或真实用户数据。\n\n"
        "- Demo：\n- 测试账号：\n- 临时密码：\n- 有效期：\n- 额外说明：\n",
        encoding="utf-8",
    )
    (folder / "private/09-gift-shipping.json").write_text(
        json.dumps(
            {
                "schema_version": "vibe-a-thon-gift-shipping/v1",
                "submission_id": args.id,
                "recipient_name": "",
                "phone": "",
                "address": "",
            },
            ensure_ascii=False,
            indent=2,
        ) + "\n",
        encoding="utf-8",
    )
    render(folder, data)
    print(folder)
    return 0


def command_render(args) -> int:
    folder = Path(args.folder).expanduser().resolve()
    data = load_submission(folder)
    data["updated_at"] = now_iso()
    (folder / "00-submission.json").write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    render(folder, data)
    print(f"rendered {folder}")
    return 0


def command_validate(args) -> int:
    folder = Path(args.folder).expanduser().resolve()
    result = validate(folder, load_submission(folder))
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0 if result["valid"] else 1


def main() -> int:
    parser = argparse.ArgumentParser()
    subparsers = parser.add_subparsers(dest="command", required=True)
    init_parser = subparsers.add_parser("init")
    init_parser.add_argument("--root", required=True)
    init_parser.add_argument("--id", required=True)
    init_parser.add_argument("--title", default="")
    init_parser.set_defaults(func=command_init)
    render_parser = subparsers.add_parser("render")
    render_parser.add_argument("folder")
    render_parser.set_defaults(func=command_render)
    validate_parser = subparsers.add_parser("validate")
    validate_parser.add_argument("folder")
    validate_parser.set_defaults(func=command_validate)
    args = parser.parse_args()
    try:
        return args.func(args)
    except (ValueError, KeyError, json.JSONDecodeError) as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
