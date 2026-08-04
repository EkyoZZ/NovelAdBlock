# NovelAdBlock

[中文](#中文) | [English](#english)

## 中文

NovelAdBlock 是一个面向移动小说网站的轻量级用户脚本，用于拦截恶意广告跳转、弹窗、动态注入脚本和广告 iframe。项目最初针对 Alook 浏览器和 `tzkibb.com` 一类使用 `bicaaa` 广告框架的网站设计，同时保留了可扩展的核心模块与站点规则结构。

### 主要功能

- 拦截已识别的跨域广告跳转和弹窗
- 拦截匹配规则的动态脚本与 iframe
- 检测可疑的定时器、`eval` 和 History API 跳转
- 阻止已识别广告代码注册触摸事件监听器
- 禁用 `bicaaa1`、`bicaaa2`、`ziitrc` 等广告入口函数
- 支持按域名添加独立规则
- 提供可选的控制台调试日志

### 安装

可直接安装或导入仓库根目录的 [`UserScript.js`](./UserScript.js)。

在 Alook 浏览器中，请将文件内容添加为 JavaScript 扩展或用户脚本，并设置为页面加载开始时运行。其他支持 UserScript 的浏览器或脚本管理器也可以导入该文件。

> `UserScript.js` 是已合并的可安装成品；`Scripts` 目录中的文件是模块化源码，不能单独作为完整脚本导入。

### 项目结构

```text
NovelAdBlock/
├── UserScript.js
├── README.md
└── Scripts/
    ├── Core/
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

源码中的调试日志默认关闭。需要分析拦截行为时，在脚本安装前或调试版本中将以下属性设为 `true`：

```js
window.NovelAdBlock.debug = true;
```

启用后，可在浏览器控制台中查看带有 `[NovelAdBlock]` 前缀的拦截记录。

### 添加规则

规则文件放在 `Scripts/Rules` 下，并通过 `registerRule` 注册。例如：

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

- `hosts`：规则生效的网站；设为 `null` 时对所有网站生效
- `disableGlobals`：需要禁用的全局广告函数名
- `blockHosts`：需要拦截的目标域名
- `blockPatterns`：用于匹配目标 URL 的正则表达式
- `blockThirdPartyPopups`：是否拦截所有跨域弹窗；启用时应谨慎测试

新增或修改模块后，在仓库根目录运行：

```powershell
.\Scripts\Build\Build.ps1
```

构建脚本会按既定加载顺序合并源码，在根目录重新生成 UTF-8 BOM + CRLF 格式的 `UserScript.js`。加载顺序为：`Analyzer`、`Core`、规则文件、Hook 模块，最后调用 `window.NovelAdBlock.install()`。

### 注意事项

- 当前版本为早期开发版本，应先在目标网站验证阅读、翻页、登录和支付等正常功能。
- 浏览器对 `location.href` 等原生属性的限制不同，无法保证拦截所有跳转方式。
- 通用规则应保持保守，避免影响正常的第三方登录、下载或支付窗口。
- 提交问题时，请提供网站域名、触发步骤和调试日志，并删除其中的个人信息。

## English

NovelAdBlock is a lightweight userscript for mobile novel websites. It blocks known malicious ad redirects, popups, dynamically injected scripts, and advertising iframes. The project was initially designed for Alook Browser and sites such as `tzkibb.com` that use the `bicaaa` advertising framework, while keeping the core hooks and site rules modular and extensible.

### Features

- Blocks known cross-origin ad redirects and popups
- Blocks dynamically injected scripts and iframes that match active rules
- Detects suspicious timers, `eval` calls, and History API navigation
- Prevents recognized advertising code from registering touch listeners
- Disables known ad entry points such as `bicaaa1`, `bicaaa2`, and `ziitrc`
- Supports domain-specific rules
- Includes optional console diagnostics

### Installation

Install or import [`UserScript.js`](./UserScript.js) from the repository root.

In Alook Browser, add the file contents as a JavaScript extension or userscript and configure it to run at the start of page loading. The file can also be imported into other browsers or userscript managers that support the UserScript format.

> `UserScript.js` is the bundled, installable artifact. Files under `Scripts` are modular source files and are not complete standalone userscripts.

### Project structure

```text
NovelAdBlock/
├── UserScript.js
├── README.md
└── Scripts/
    ├── Core/
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

### Debug mode

Diagnostic logging is disabled by default. Set the following property to `true` before installation, or in a debug build, to inspect blocking decisions:

```js
window.NovelAdBlock.debug = true;
```

Messages are written to the browser console with the `[NovelAdBlock]` prefix.

### Adding a rule

Place rule files under `Scripts/Rules` and register them with `registerRule`:

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

- `hosts`: Sites where the rule is active; use `null` for a global rule
- `disableGlobals`: Global advertising function names to disable
- `blockHosts`: Destination hostnames to block
- `blockPatterns`: Regular expressions matched against destination URLs
- `blockThirdPartyPopups`: Whether to block every cross-origin popup; test carefully when enabled

After changing or adding modules, run the following command from the repository root:

```powershell
.\Scripts\Build\Build.ps1
```

The build script merges the sources in their required load order and regenerates `UserScript.js` with UTF-8 BOM and CRLF line endings. The order is `Analyzer`, `Core`, rule files, Hook modules, and finally `window.NovelAdBlock.install()`.

### Limitations and safety

- This is an early development release. Verify reading, chapter navigation, sign-in, and payment flows on each target site.
- Browser restrictions around native properties such as `location.href` mean that not every navigation method can be intercepted.
- Keep generic rules conservative to avoid breaking legitimate third-party authentication, downloads, or payment windows.
- When reporting an issue, include the domain, reproduction steps, and diagnostic logs after removing personal information.

## License

No license has been selected yet. Until a license file is added, all rights are reserved by the repository owner.
