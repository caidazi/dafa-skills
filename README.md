
### 前置条件：获取 API Key

需要先在财搭子 App 中领取 API Key。

1. 打开财搭子 App。
2. 进入大发 agent 页面。
3. 点击左上角的 skill icon。
4. 进入 Skills 页面，领取或复制 API Key。
5. 在启动你的 AI Agent 前，把这个 key 设置为 `CAIDAZI_API_KEY`。

### 安装步骤
安装财搭子（Caidazi）skills 和 MCP。

数据源
- Repo: https://github.com/caidazi/dafa-skills.git
- MCP Endpoint: http://101.126.22.17:5011/mcp
- MCP Auth: Bearer $CAIDAZI_API_KEY

安装要求
1. 拉取仓库到临时目录，读取 manifest.yaml 获取 skill 列表。
2. 安装 Skills 到你所在环境的正确 skills 目录：
   - 每个 skill 必须是独立子目录
   - 必须保留 SKILL.md 的完整 frontmatter，严禁删除
   - 如环境支持 user-invocable，评估是否添加该标记
3. 配置 MCP Server：
   - Name: caidazi
   - Transport: Streamable HTTP
   - URL: http://101.126.22.17:5011/mcp
   - Headers: Authorization: Bearer $CAIDAZI_API_KEY
4. 验证：列出已安装的财搭子 skills，确认能被调用。
5. 报告安装路径、MCP 配置位置、调用方式。
