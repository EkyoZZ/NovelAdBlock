# NovelAdBlock

[中文](#中文) | [English](#english)

## 中文

NovelAdBlock 是一个面向移动小说网站的轻量级用户脚本，用于拦截恶意广告跳转、弹窗、动态注入脚本和广告 iframe。项目主要针对 Alook 浏览器与 `tzkibb.com` 使用的 `bicaaa` 广告框架，同时保留模块化核心和可扩展的站点规则。

### 当前版本与支持范围

当前稳定版本：**v0.2.7**

- `tzkibb.com`：针对性支持，包含章节导航和 Cloudflare 验证页兼容
- `bicaaa` 广告框架：实验性通用识别
- 其他小说网站：仅应用保守的通用规则，不保证完全拦截

### 主要功能

- 拦截已识别的跨域广告跳转和弹窗
- 拦截匹配规则的动态脚本与 iframe
- 检测可疑的定时器、`eval` 和 History API 导航
- 阻止已识别广告代码注册触摸追踪监听器
- 禁用 `bicaaa0`、`bicaaa1`、`bicaaa2`、`ziitrc` 等广告入口函数
- 在网页主 JavaScript 环境中安装关键保护，兼容 Alook 的脚本执行方式
- 识别 Cloudflare “Just a moment...”验证页，并暂停全部广告 Hook
- 支持按域名添加独立规则和可选的控制台调试日志

### 安装

可直接安装或导入仓库根目录的 [`UserScript.js`](./UserScript.js)。这是唯一需要导入 Alook 的文件。

在 Alook 浏览器中：

1. 将 `UserScript.js` 添加为 JavaScript 扩展或用户脚本。
2. 将执行时间设置为“尽早”或页面加载开始时。
3. 启用脚本后，关闭已经打开的小说标签，再重新打开页面。
4. 更新脚本时同样需要关闭旧标签；已经运行的广告监听器不会被磁盘上的新版本自动清除。

不需要进入 Alook 阅读模式。`Scripts` 目录中的文件是模块化源码，不能单独作为完整用户脚本导入。

### Cloudflare 验证兼容

v0.2.7 会等待页面类型明确后再安装核心：

- 检测到 `Just a moment...`、`window._cf_chl_opt`、`/cdn-cgi/challenge-platform/`、Cloudflare CSP 或验证页元数据时，NovelAdBlock 会完全退出。
- 检测到小说页自己的 `wap.js` 或 `tools.js` 后，才会安装广告保护。
- 验证完成并进入小说正文后，保护会在新页面正常恢复。

### 项目结构

```text
NovelAdBlock/
├── LICENSE
├── README.md
├── UserScript.js
└── Scripts/
    ├── Build/
    │   └── Build.ps1
    ├── Core/
    │   ├── PageBootstrap.js
    │   ├── Analyzer.js
    │   ├── Core.js
    │   ├── HookEval.js
    │   ├── HookHistory.js
    │   ├── HookIframe.js
    │   ├── HookLocation.js
    │   ├── HookScript.js
    │   ├── HookTimer.js
    │   └── HookTouch.js
    └── Rules/
        ├── Generic.js
        ├── bicaaa.js
        ├── Cloudflare.js
        └── Tzkibb.js
```

### 调试模式

调试日志默认关闭。调试构建可将 `Scripts/Core/Analyzer.js` 中的 `N.debug` 设为 `true`，重新构建后在浏览器控制台查看带有 `[NovelAdBlock]` 前缀的记录。

### 添加规则

规则文件放在 `Scripts/Rules` 下，并通过 `registerRule` 注册：

```js
(function (root) {
  root.NovelAdBlock.registerRule({
    id: 'example',
    hosts: ['example.com'],
    disableGlobals: ['exampleAd'],
    blockHosts: ['ads.example.net'],
    blockPatterns: [/\/advertisement\//i],
    blockThirdPartyPopups: false
  });
})(window);
```

常用字段：

- `hosts`：规则生效的网站；设为 `null` 时为全局规则
- `disableGlobals`：需要禁用的全局广告函数
- `blockHosts`：需要拦截的目标域名
- `blockPatterns`：用于匹配目标 URL 的正则表达式
- `blockThirdPartyPopups`：是否拦截所有跨域弹窗
- `lockGlobalsImmediately`：是否在页面早期锁定广告入口函数
- `lockGlobalsAfterScripts`：指定脚本加载后再次锁定全局函数
- `blockTouchTracking`：是否隔离页面级触摸追踪
- `clearSessionStoragePatterns`：需要清理的广告配置缓存键

站点规则应保持保守。开启全局弹窗、触摸或定时器拦截前，应验证登录、支付、下载和正常导航。

### 构建

在仓库根目录运行：

```powershell
.\Scripts\Build\Build.ps1
```

如果 PowerShell 阻止脚本执行，可仅为本次运行临时放行：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\Scripts\Build\Build.ps1
```

构建顺序为：`PageBootstrap` → `Analyzer` → `Core` → 规则文件 → Hook 模块 → `window.NovelAdBlock.install()`。生成的 `UserScript.js` 使用 UTF-8 BOM + CRLF。

### 故障排查

- Cloudflare 页面空白：确认版本至少为 v0.2.7，并关闭旧标签后重新打开
- 夜色模式失效：不要使用曾全面禁止页面定时器的 v0.1.3
- URL 包含 `_novel_adblock`：这是旧版本遗留参数，请删除该参数并升级
- 启用后第一次点击仍跳转：脚本可能是在页面打开后才启用；请刷新或重新打开页面
- 更新后仍跳转：关闭所有相关旧标签，再从新标签复现
- 提交问题时，请提供网站域名、章节 URL、上一章或下一章方向、触发步骤、版本号和录像，并删除个人信息

### 已知限制

- 浏览器对 `location.href` 等原生属性的限制不同，无法保证拦截所有跳转方式。
- Alook 的实际注入时机会影响页面脚本与保护代码的执行顺序。
- 广告框架和跳转域名可能动态变化，需要持续更新规则。
- 当前项目仍处于早期开发阶段，应在目标网站验证阅读、翻页、登录和支付等正常功能。

### 版本记录

- **v0.2.7**：等待页面判型，兼容 Cloudflare 安全验证
- **v0.2.3**：移除章节 URL 参数注入，并清理旧参数
- **v0.2.0**：加入网页主环境 `PageBootstrap`
- **v0.1.0**：建立模块化核心、Hook 和规则结构

### 许可证

本项目采用 [MIT License](./LICENSE) 开源许可证。

## English

NovelAdBlock is a lightweight userscript for mobile novel websites. It blocks known malicious ad redirects, popups, dynamically injected scripts, and advertising iframes. The project primarily targets Alook Browser and the `bicaaa` advertising framework used by `tzkibb.com`, while keeping its core hooks and site rules modular.

### Current version and support

Current stable version: **v0.2.7**

- `tzkibb.com`: Targeted support, including chapter navigation and Cloudflare challenge compatibility
- `bicaaa` advertising framework: Experimental generic detection
- Other novel sites: Conservative generic rules only; complete blocking is not guaranteed

### Features

- Blocks known cross-origin ad redirects and popups
- Blocks dynamically injected scripts and iframes matched by active rules
- Detects suspicious timers, `eval` calls, and History API navigation
- Prevents recognized ad code from registering touch-tracking listeners
- Disables ad entry points such as `bicaaa0`, `bicaaa1`, `bicaaa2`, and `ziitrc`
- Installs critical protection in the page's main JavaScript environment for Alook compatibility
- Detects Cloudflare “Just a moment...” pages and pauses every advertising hook
- Supports domain-specific rules and optional console diagnostics

### Installation

Install or import [`UserScript.js`](./UserScript.js) from the repository root. It is the only file that should be imported into Alook.

In Alook Browser:

1. Add `UserScript.js` as a JavaScript extension or userscript.
2. Configure it to run as early as possible or at the start of page loading.
3. After enabling it, close existing novel tabs and open the page again.
4. Do the same after every update; code already running in an old tab is not replaced automatically.

Alook Reading Mode is not required. Files under `Scripts` are modular source files and are not complete standalone userscripts.

### Cloudflare challenge compatibility

Starting with v0.2.7, the core waits until the page type is known:

- NovelAdBlock exits completely when it detects `Just a moment...`, `window._cf_chl_opt`, `/cdn-cgi/challenge-platform/`, Cloudflare CSP, or challenge metadata.
- Advertising protection is installed only after the site's `wap.js` or `tools.js` marker is detected.
- Protection resumes normally on the novel page after verification succeeds.

### Project structure

The project structure is shown in the Chinese section above.

### Debug mode

Diagnostics are disabled by default. For a debug build, set `N.debug` to `true` in `Scripts/Core/Analyzer.js`, rebuild, and inspect messages prefixed with `[NovelAdBlock]` in the browser console.

### Adding a rule

Place rule files under `Scripts/Rules` and register them with `registerRule`. Supported fields include:

- `hosts`: Sites where the rule is active; use `null` for a global rule
- `disableGlobals`: Global advertising functions to disable
- `blockHosts`: Destination hostnames to block
- `blockPatterns`: Regular expressions matched against destination URLs
- `blockThirdPartyPopups`: Whether to block all cross-origin popups
- `lockGlobalsImmediately`: Lock advertising entry points during early page loading
- `lockGlobalsAfterScripts`: Lock globals again after selected scripts load
- `blockTouchTracking`: Isolate page-level touch tracking
- `clearSessionStoragePatterns`: Advertising configuration cache keys to remove

Keep site rules conservative. Test authentication, payments, downloads, and normal navigation before enabling broad popup, touch, or timer blocking.

### Build

Run from the repository root:

```powershell
.\Scripts\Build\Build.ps1
```

If PowerShell blocks script execution:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\Scripts\Build\Build.ps1
```

The load order is `PageBootstrap` → `Analyzer` → `Core` → rules → Hook modules → `window.NovelAdBlock.install()`. The generated `UserScript.js` uses UTF-8 BOM and CRLF line endings.

### Troubleshooting

- Blank Cloudflare page: Use v0.2.7 or newer, close the old tab, and reopen the page
- Night mode no longer works: Do not use v0.1.3, which temporarily blocked every page timer
- URL contains `_novel_adblock`: Remove the legacy parameter and upgrade
- First click redirects after enabling: Reload or reopen the page so the script runs during loading
- Redirects continue after an update: Close all related old tabs before reproducing
- Include the domain, chapter URL, navigation direction, reproduction steps, version, and a privacy-scrubbed recording when reporting an issue

### Limitations

- Native browser restrictions around properties such as `location.href` mean that not every navigation method can be intercepted.
- Alook's actual injection timing affects the execution order between page scripts and protection code.
- Advertising frameworks and redirect domains may change dynamically and require rule updates.
- This remains an early development project. Verify reading, navigation, sign-in, and payment flows on each target site.

### Changelog

- **v0.2.7**: Deferred installation until page classification and added Cloudflare challenge compatibility
- **v0.2.3**: Removed chapter URL parameter injection and cleaned up legacy parameters
- **v0.2.0**: Added the main-page-world `PageBootstrap`
- **v0.1.0**: Introduced the modular core, hooks, and rules

### License

This project is licensed under the [MIT License](./LICENSE).
