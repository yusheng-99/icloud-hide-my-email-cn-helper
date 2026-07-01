# iCloud 隐藏邮箱助手

一个基于浏览器扩展的 iCloud 隐藏邮箱管理工具，适配 iCloud 中国区，提供中文界面、批量获取、自动邮箱池和隐藏邮箱管理功能。

本项目基于 [`dedoussis/icloud-hide-my-email-browser-extension`](https://github.com/dedoussis/icloud-hide-my-email-browser-extension) 修改，遵循 MIT License。

## 功能特性

- **中文界面**：弹窗、管理页、提示信息均已中文化。
- **iCloud 中国区适配**：默认使用 `https://www.icloud.com.cn`。
- **轻量弹窗**：右上角弹窗只检查 iCloud 登录状态，并提供进入管理页的入口。
- **批量获取隐藏邮箱**：可一次获取多个 iCloud 隐藏邮箱。
- **自动邮箱池**：支持启动、停止、立即获取 5 个、复制、下载 TXT、清空。
- **隐藏邮箱管理**：支持搜索、复制、停用、启用和删除已停用邮箱。
- **转发地址切换**：可在扩展设置中选择 iCloud 隐藏邮箱的转发地址。
- **可选桌面 TXT 写入**：自动获取到的邮箱可追加写入本地 TXT，需要配合本地写入服务使用。

## 安装使用

### 1. 安装依赖

```powershell
npm ci
```

### 2. 构建扩展

```powershell
npm run build
```

### 3. 加载到 Chrome

1. 打开 `chrome://extensions`
2. 开启右上角“开发者模式”
3. 点击“加载已解压的扩展程序”
4. 选择项目里的 `build` 目录

### 4. 登录 iCloud

在当前浏览器打开：

```text
https://www.icloud.com.cn
```

登录 iCloud，并完成双重认证。建议选择“信任此浏览器”，这样扩展读取登录状态会更稳定。

## 使用方式

加载扩展后，点击浏览器右上角扩展图标：

- 未登录 iCloud：显示登录提示。
- 已登录 iCloud：显示进入管理页面按钮。

进入管理页面后，可以：

- 批量获取隐藏邮箱
- 复制获取结果
- 管理自动邮箱池
- 查看、搜索、停用、启用、删除隐藏邮箱
- 切换隐藏邮箱转发地址

## 桌面 TXT 写入（可选）

扩展内置了一个本地写入接口调用能力，用于把自动获取到的邮箱追加写入桌面 TXT。

该功能需要你另外运行一个本地服务，监听：

```text
http://127.0.0.1:37651/append
```

请求头使用：

```text
x-icloud-hme-auto-token: local-dev-token
```

如果本地服务未启动，扩展不会丢失邮箱，会自动保存到扩展内部邮箱池。也可以在管理页面关闭“写入桌面 TXT”开关。

## 开发命令

```powershell
npm run build
npm run start
npm run lint
npm run prettier
```

Firefox 构建：

```powershell
npm run build:firefox
```

## 构建产物

`build/` 是本地构建产物，默认不会提交到仓库。发布或手动安装时，请先运行：

```powershell
npm run build
```

然后打包或加载 `build` 目录。

## 与上游项目的主要差异

- 默认 iCloud 入口改为中国区。
- UI 改为中文，并重做弹窗和管理页布局。
- 移除原本偏自动填充的主流程，改为以隐藏邮箱获取和管理为核心。
- 增加批量获取、自动邮箱池、桌面 TXT 写入开关。
- 替换扩展图标为蓝色版本。

## 版权与协议

原项目：

- Repository: https://github.com/dedoussis/icloud-hide-my-email-browser-extension
- License: MIT License
- Copyright: Copyright (c) 2022-2024 Dimitrios Dedoussis

本项目是修改版，不代表原作者发布或维护。

本项目与 Apple Inc. 无关联，也不受 Apple Inc. 认可、维护或赞助。iCloud、Apple 和 Hide My Email 是 Apple Inc. 的商标。

## License

MIT License. See [`LICENSE`](./LICENSE) and [`NOTICE.md`](./NOTICE.md).
