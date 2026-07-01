# iCloud 隐藏邮箱助手（中文增强版）

这是 [`dedoussis/icloud-hide-my-email-browser-extension`](https://github.com/dedoussis/icloud-hide-my-email-browser-extension) 的修改版，基于 MIT License 发布。

本项目保留原项目的 iCloud Hide My Email 管理能力，并针对个人本地使用做了中文化、iCloud 中国区适配、批量获取和自动获取邮箱池等增强。

## 功能

- 中文界面。
- 默认使用 iCloud 中国区接口。
- 右上角弹窗只负责检查 iCloud 连接状态，并跳转到管理页面。
- 管理页面支持批量获取隐藏邮箱。
- 自动获取邮箱池：可开始、停止、立即获取 5 个、复制、下载 TXT、清空。
- 可选写入桌面 TXT：默认开启，可在页面里关闭。
- 隐藏邮箱管理：搜索、复制、停用、启用、删除已停用邮箱。
- 转发地址切换。

## 安装 / 本地使用

```powershell
npm ci
npm run build
```

然后在 Chrome 打开：

```text
chrome://extensions
```

开启“开发者模式”，选择“加载已解压的扩展程序”，加载：

```text
build
```

## 桌面 TXT 写入

自动获取邮箱池可以把获取到的邮箱追加写入桌面 TXT。

该能力依赖本地写入助手监听：

```text
http://127.0.0.1:37651/append
```

如果本地助手未启动，扩展仍会把邮箱保存到扩展内部。管理页面里可以关闭“写入桌面 TXT”开关。

本地写入接口默认使用公开占位 token：

```text
local-dev-token
```

如果你需要更严格的本地校验，请自行修改扩展和本地写入助手两边的 token。

## 构建产物

`build/` 为构建产物，已在 `.gitignore` 中忽略。建议源码提交到 GitHub，发布压缩包时再从 `build/` 打包。

## 上游项目

原项目：

- Repository: https://github.com/dedoussis/icloud-hide-my-email-browser-extension
- License: MIT License
- Copyright: Copyright (c) 2022-2024 Dimitrios Dedoussis

本项目是修改版，不代表原作者发布或维护。

## 免责声明

This project is not affiliated with, endorsed by, maintained, authorized, or sponsored by Apple Inc.

iCloud, Apple, and Hide My Email are trademarks of Apple Inc.

## License

MIT License. See [`LICENSE`](./LICENSE) and [`NOTICE.md`](./NOTICE.md).
