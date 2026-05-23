# 外部 Skill 分发系统设计

## 核心问题

三个平台（Claude Code / OpenClaw / Codex）的 skill 安装机制完全不同，但底层内容一样：SKILL.md 指令 + MCP Server 连接配置。需要一个方案做到「一份源码，三端分发」。

## 方案：CLI + Git Repo 双轨分发

### 1. 仓库结构（单源真相）

```
caidazi-skills/                    # 独立公开 repo
├── manifest.yaml                  # 版本 + skill 列表 + MCP 依赖
├── README.md
├── caidazi-asset-research/
│   └── SKILL.md
├── caidazi-finance-search/
│   └── SKILL.md
├── caidazi-fund-etf-research/
│   └── SKILL.md
├── caidazi-macro-research/
│   └── SKILL.md
├── caidazi-market-pulse/
│   └── SKILL.md
├── caidazi-portfolio-review/
│   └── SKILL.md
├── caidazi-stock-screener/
│   └── SKILL.md
├── caidazi-user-assets/
│   └── SKILL.md
├── snippets/                      # 平台安装提示片段（install.sh 的数据源）
│   ├── claude-code.md
│   ├── openclaw.md
│   └── codex.md
├── install.sh                     # curl | sh 一键入口
└── .github/workflows/             # P1：release 自动化
```

Skill 目录直接放在根目录，不额外嵌套 `skills/` 子目录——这个 repo 本身就是 skills 仓库，多套一层没有意义。

### 2. 安装体验（一键，三步变一步）

用户侧理想流程：

```bash
# 方式一：curl 一键装
curl -fsSL https://caidazi.com/install-skills.sh | bash -s -- --key $CAIDAZI_API_KEY --platform claude-code

# 方式二：pip 装 CLI（后续可加）
pip install caidazi-skills && caidazi-skills install --key $CAIDAZI_API_KEY
```

CLI 做的事情：

1. **检测平台** — 看当前目录是 Claude Code 项目（有 `.claude/`）、OpenClaw 项目、还是 Codex 项目，也可 `--platform` 指定
2. **写 MCP 配置** — 把 MCP server URL + auth token 写进对应平台的 config
   - Claude Code: `.claude/settings.json` 的 `mcpServers`
   - OpenClaw: 对应配置文件
   - Codex: 对应配置文件
3. **合并 Skill 指令** — 把选中的 SKILL.md 内容合并追加到 `CLAUDE.md`（或等价文件），加上分隔标记便于后续更新
4. **验证连通性** — 调一下 MCP server 的 health 端点确认 key 可用

### 3. 更新机制

安装时在 CLAUDE.md 里用标记包裹注入内容：

```markdown
<!-- caidazi-skills v0.1.0 begin -->
...skills content...
<!-- caidazi-skills v0.1.0 end -->
```

更新流程：

1. 读取本地 `manifest.yaml` 记录的版本号
2. 拉远程最新 manifest.yaml 比对版本
3. 有新版 → 替换标记之间的内容，更新 MCP 配置
4. 无新版 → 跳过

用户侧：`caidazi-skills update` 或 `curl ... | bash -s -- --update`

### 4. 各平台适配要点

| 平台 | 需要写什么 | 关键文件 |
|---|---|---|
| **Claude Code** | `mcpServers` 配置 + CLAUDE.md 指令 | `.claude/settings.json`、`CLAUDE.md` |
| **OpenClaw** | MCP endpoint + skill prompts | OpenClaw 的 skill config |
| **Codex** | MCP endpoint + skill prompts | Codex 的 instructions/config |

MCP server URL 固定（`https://mcp.zhicepilot.com`），auth 用 `CAIDAZI_API_KEY` bearer token —— 三个平台一样，只是配置格式不同。

### 5. 版本发布流程

```
修改 SKILL.md → 改 manifest.yaml version → git tag → push
                                    ↓
                          GitHub Release 自动触发
                                    ↓
                    用户下次 update 时拉到新版
```

### 6. 分阶段落地

- **P0**：建 repo + 搬文件 + 写 `install.sh` 支持 Claude Code 安装，跑通一个平台再加其他两个
- **P1**：补齐 OpenClaw / Codex 适配，加 GitHub Release + tag 版本管理
- **P2**：做成 pip/npm 包，支持 `caidazi-skills install/update/list`
- **P3（可选）**：MCP server 加一个 `GET /api/skills/manifest` 端点，让 CLI 不依赖 GitHub 就能检查更新

## 工程实施

### dafa-agent 侧变更

- 删除 `dafa-agent/external/skills/` 目录，后续不再维护两份
- `dafa-agent` 内部的 agent prompt 和 MCP 工具编排是独立逻辑，不受影响
- 唯一的同步点：MCP server 新增/改名工具时，`SKILL.md` 里引用的工具名要跟着改（在公开 repo 里改，`manifest.yaml` 的 `required_mcp` 字段追踪这个依赖）

### 第一步

写 `install.sh` 支持 Claude Code 安装。