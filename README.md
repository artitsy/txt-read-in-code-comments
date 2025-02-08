# txt read in code comments 项目介绍

<!-- ALL-CONTRIBUTORS-BADGE:START - Do not remove or modify this section -->
[![All Contributors](https://img.shields.io/badge/all_contributors-3-orange.svg?style=flat-square)](#contributors-)
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

`Ctrl + ,` 打开设置，搜索 `txt-read-in-code-comments.`，开始自定义。

### 阅读标识符

可以在插件设置 `txt-read-in-code-comments.Sign` 中设置阅读标识符，默认为 `/// `（三个斜杠+一个空格）。

按语言自定义：
1. 不确定语言id可以 __单击__ 状态栏右侧的语言（如 `c++`），语言id是括号里那个（如 `cpp`）。
1. `default` 为失配设置。
1. "a" 指单行注释，"b" 指多行注释（多行注释暂未实现）。

推荐的单行标识符格式为：
- 你所使用的编程语言的**注释符** + 一个**用于区分**的符号 + 一个**空格**。
- **注释符**是为了避免它太突兀。
- **用于区分**的符号是为了避免它与其他注释冲突。
- **空格**是为了美观。（雾

### 最多单行显示字数

可以在插件设置 `txt-read-in-code-comments.WordsLimit` 中设置最多单行显示字数，默认为 20。

---

## 使用

### 第 零 步 下载本插件

你可以通过 VSCode 或 marketplace 下载本插件。

### 第 一 步 准备 `txt` 文件

当然需要你自己准备。

### 第 二 步 初始化

调用插件 `read.init` 命令：

![](https://cdn.ipfsscan.io/weibo/large/008D5oyhly1hnveg1m0ogj30sg0lcabx.jpg)

选取文件：

![](https://cdn.ipfsscan.io/weibo/large/008D5oyhly1hnvegis01cj30q30etwhz.jpg)

### 第 三 步 开始阅读

调用插件 `read.next` 命令或使用 `Alt+right` 或 `Alt+d` 快捷键，插件会自动读取下一句并放到代码中第一个阅读标识符的后面。

调用插件 `read.last` 命令或使用 `Alt+left` 或 `Alt+a` 快捷键，插件会自动读取上一句并放到代码中第一个阅读标识符的后面。（请不要使用 `Ctrl + Z` 退回，那样会令程序困惑）

---

## 注意：

1. 本项目还在开发和维护，可能常有奇奇怪怪的更新。~~比如快捷键按不动了，大概率是又改了。~~

1. 一定要确保你所使用的阅读标识符独特。

1. `read.init` 会清除之前的记录。

1. 选中文本中的内容会被插件记下，原 `txt` 文件的修改或删除不会产生影响。

1. 在任何代码、工作区中，阅读进度是一致的。

1. 到换行视为一句。如果一次读取字符个数超过最多显示字数，会分开显示。

1. 若代码中没有阅读标识符，则会在光标前一行插入内容（阅读标识符 + 文本内容）。

1. 显然，若第一个阅读标识符后有内容，会先清除原内容再插入。

## 更多

### 正在解决的问题或正在实现的功能

- [x] 从文件选择器初始化
- [x] 支持自定义阅读标识符
- [x] 支持自定义最多显示字数
- [x] 支持在未保存的编辑器中阅读
- [x] 解决高频率翻页导致数据冲突崩溃
- [x] 精确修改（避免全量刷新
- [X] 更多编码支持
- [ ] 更多阅读方法
  - [ ] 阅读范围标识符 （类似与 c++ 的 `/* */`）
  

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
