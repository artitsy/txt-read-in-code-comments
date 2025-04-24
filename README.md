# txt read in code comments 项目介绍

<!-- ALL-CONTRIBUTORS-BADGE:START - Do not remove or modify this section -->
[![All Contributors](https://img.shields.io/badge/all_contributors-4-orange.svg?style=flat-square)](#contributors-)
<!-- ALL-CONTRIBUTORS-BADGE:END -->

这是一个能帮助你在代码注释中嵌入文本内容的插件。

> Not for work, let's goof off.

![](https://cdn.ipfsscan.io/weibo/large/008D5oyhly1hndslmi4lhg30hs0cv4qu.gif)

目录：
1. [设置](#设置)
2. [使用](#使用)
3. [注意](#注意)
4. [更多](#更多)

---

## 设置

`Ctrl+Shift+P`，输入 `read.settings` 以打开插件设置项。

### 最多单行显示字数

可以在插件设置 `WordsLimit` 中设置最多单行显示字数，默认为 20。

### 阅读标识符

可以在插件设置 `Sign` 中设置阅读标识符。

按语言自定义：
1. 不确定语言id可以 __单击__ 状态栏右侧的语言（如 `c++`），语言id是括号里那个（如 `cpp`）。
1. `default` 为失配设置，默认为 `/// `（三个斜杠+一个空格）。未设置过的语言会跟随 `default` 的设置。

推荐的单行标识符格式为：
- 你所使用的编程语言的**注释符** + 一个**用于区分**的符号 + 一个**空格**。
- **注释符**是为了避免它太突兀，并且使它不影响代码运行。
- **用于区分**的符号是为了避免它与其他注释冲突。
- **空格**是为了美观。（雾

### 显示位置或方法

可以在插件设置 `DisplayPlace` 中设置显示位置或方法。

目前支持：
- `行内注释`。
- `状态栏`。注意，若 `WordsLimit` 过大，可能无法完全显示。

---

## 使用

### 第 零 步 下载本插件

你可以通过 VSCode 或 marketplace 下载本插件。

### 第 一 步 准备文本文件

当然需要你自己准备。

### 第 二 步 初始化

调用插件 `read.init` 命令：

![](https://cdn.ipfsscan.io/weibo/large/008D5oyhly1hnveg1m0ogj30sg0lcabx.jpg)

选取文件：

![](https://cdn.ipfsscan.io/weibo/large/008D5oyhly1hnvegis01cj30q30etwhz.jpg)

### 第 三 步 开始阅读

调用插件 `read.next` 命令或使用 `Alt+right` 或 `Alt+D` 快捷键，插件会自动读取下一句并放到代码中第一个阅读标识符的后面。

调用插件 `read.last` 命令或使用 `Alt+left` 或 `Alt+A` 快捷键，插件会自动读取上一句并放到代码中第一个阅读标识符的后面。（请不要使用 `Ctrl+Z` 退回）。

### 老板键

调用插件 `read.hide` 命令或使用 `Alt+S` 快捷键。

### 跳转

调用插件 `read.turn` 命令或使用 `Alt+T` 快捷键。

---

## 注意：

1. 本项目还在开发和维护，可能常有奇奇怪怪的更新。

1. 一定要确保你所使用的阅读标识符独特。

1. `read.init` 会清除之前的记录。

1. 选中文本中的内容会被插件记下，原 `txt` 文件的修改或删除不会产生影响。

1. 在任何代码、工作区中，阅读进度是一致的。

1. 到换行，或字符个数超过最多显示字数，断为一句。

1. 标点符号算入字数。句末可以额外吸收一个标点符号。

1. `DisplayPlace` 为 `行内注释` 时，若代码中没有阅读标识符，则会在光标前一行插入内容（阅读标识符 + 文本内容）。

1. 显然，若阅读标识符后有内容，会先清除原内容再插入。

## 更多

### 正在解决的问题或正在实现的功能

- [x] 从文件选择器初始化
- [x] 支持自定义阅读标识符
- [x] 支持自定义最多显示字数
- [x] 支持在未保存的编辑器中阅读
- [x] 解决高频率翻页导致数据冲突崩溃
- [x] 精确修改（避免全量刷新
- [X] 更多编码支持
- [X] 老板键
- [X] 跳转功能
- [X] 在状态栏阅读
- [ ] 导出、导入

### 一个优秀的项目，出自支持与改进

如果你觉得这个项目不错，不妨给个 `star` 吧。
如果你发现不足，欢迎反馈！

## Contributors

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tbody>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="http://limit-bed.com"><img src="https://avatars.githubusercontent.com/u/150017579?v=4?s=100" width="100px;" alt="Lim Watt"/><br /><sub><b>Lim Watt</b></sub></a><br /><a href="#maintenance-Lim-Watt" title="Maintenance">🚧</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/tsxc-github"><img src="https://avatars.githubusercontent.com/u/94750616?v=4?s=100" width="100px;" alt="星澜曦光"/><br /><sub><b>星澜曦光</b></sub></a><br /><a href="#maintenance-tsxc-github" title="Maintenance">🚧</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://allcontributors.org"><img src="https://avatars.githubusercontent.com/u/46410174?v=4?s=100" width="100px;" alt="All Contributors"/><br /><sub><b>All Contributors</b></sub></a><br /><a href="https://github.com/artitsy/txt-read-in-code-comments/commits?author=all-contributors" title="Documentation">📖</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/Sky-Bridge"><img src="https://avatars.githubusercontent.com/u/33591025?v=4?s=100" width="100px;" alt="Bridge"/><br /><sub><b>Bridge</b></sub></a><br /><a href="https://github.com/artitsy/txt-read-in-code-comments/commits?author=Sky-Bridge" title="Code">💻</a></td>
    </tr>
  </tbody>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->
