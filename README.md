# KEM 客户端插件模板 · 示例计数器

这是一个面向支持**原生 ESM 客户端模块**的 KEM API v1 插件模板，使用 Svelte 5、TypeScript 和 Vite。客户端与 KEM Renderer 共用同一个 Cordis 树、同一份 Svelte 运行时和同一个 document，不需要 iframe 或跨帧消息。旧的 IIFE / CommonJS 客户端加载器不适用。

| 贡献 | 位置 | 说明 |
| --- | --- | --- |
| 导航页 | `src/ExamplePage.svelte` | 显示计数和 Host revision |
| 底栏 | `src/ExampleFooter.svelte` | 常驻主界面底部，跨导航切换保持挂载 |
| 客户端服务 | `src/client.ts` | `ctx.provide('exampleCounter', …)`，供其他插件 `inject` |
| 托盘菜单 | `src/tray-menu.ts` | Vite 总是把菜单数据拆成一个相对导入的 chunk，由 `src/client.ts` 注册 |
| 共享状态 | `src/example-store.ts` | 页面、底栏、服务与托盘共同使用一个 store |
| Host 模块 | `host.mjs` | 纯界面插件可保留此空的 Cordis 默认导出 |

## 创建和开发

使用 Node.js 24 或更新版本和 `package.json` 指定的 pnpm 版本。克隆或复制模板后，可直接修改它，或从源码目录运行脚手架：

```sh
pnpm scaffold ../my-counter
cd ../my-counter
pnpm install --frozen-lockfile
pnpm run check
pnpm test
pnpm pack
```

`pnpm scaffold <新目录> [插件 ID]` 只复制源码、构建配置和测试，不复制 Git、依赖或产物。目标目录必须不存在。插件 ID 默认取目录名，同时用作初始 npm 包名；ID 必须以小写字母开头，后续只允许小写字母、数字和连字符，最长 64 个字符。示例直接从清单读取导航项 ID、标签和底栏 ID。改作自己的插件时，修改包名、版本、作者、描述以及 `kem.title`、`kem.description`、`kem.client.label`，再替换示例组件和服务。

`pnpm dev` 以 watch 模式重建 `dist/`，不会自动把改动加载到 KEM。`pnpm pack` 执行 `prepack`（重新构建和检查），在当前目录生成 `.tgz`。在支持原生 ESM 的 KEM 中通过本地插件导入功能选择该文件。正式发布前再移除 `private: true`，并把包名、精确版本和 registry 加入 KEM 市场索引。

## 清单与构建契约

```json
{
  "type": "module",
  "files": ["dist/", "host.mjs"],
  "kem": {
    "id": "example-counter",
    "apiVersion": 1,
    "host": "./host.mjs",
    "client": {
      "root": "./dist",
      "entry": "./client.js",
      "label": "计数器"
    }
  }
}
```

- `kem.client.root` 相对于 npm 包根目录，是**仅供客户端发布**的目录。`kem.client.entry` 相对于该目录，以 `./` 开头，以 `.js` 或 `.mjs` 结尾；这里实际指向包内的 `dist/client.js`，所以不要写成 `./dist/client.js`。
- `kem.host` 仍相对于 npm 包根目录，必填。将 Host 模块、服务端依赖和私有文件留在客户端根目录之外。
- 如果客户端依赖其他客户端插件，可声明 `kem.client.requires`（例如 `["media-library"]`）。这里填写的是插件 ID，不是 npm 包名或 Cordis 服务名。此示例不需要它。`inject` 仍用于声明 `apply(ctx)` 所需的 Cordis 服务，例如 `['navRail', 'surfaces']`。
- 客户端入口必须是原生 ESM，默认导出 Cordis 插件。`dist/client.js` 使用 `./chunks/tray-menu-<hash>.js` 这一相对导入；打包时保留整个 `dist/` 目录及其结构。其他相对模块和运行时资产也应留在客户端根目录内，不能引用 Host、源码或包根目录外的文件。
- `svelte`、`svelte/internal/client`、`svelte/internal/disclose-version`、`svelte/store`、`svelte/reactivity` 是 KEM 共享运行时的裸导入。Vite 将它们保留为 external，由 KEM 解析；不要把另一份 Svelte 打进产物，也不要依赖 `KEM_PLATFORM` 或 `require()`。未使用的 external 不会出现在产物里；其他浏览器依赖应打包进客户端产物。
- Vite 直接生成 `dist/`，组件 CSS 由 Svelte 注入。构建会清空 `dist/`，不要手工把源文件放在那里。`pnpm pack` 包含 `dist/`、独立的 `host.mjs`、`package.json` 和 README，不包含源码、测试或构建工具。

## 验收

```sh
pnpm run check   # TypeScript 和 Svelte
pnpm test        # 构建、检查发布路径，再用原生 import() 测试客户端
pnpm pack        # 生成供 KEM 安装的文件
```

`pnpm test` 检查入口的相对导入、Svelte 裸导入、Host 和客户端的默认导出，并用真实的 Svelte 浏览器条件导出和模拟的 Cordis/桌面桥接验证导航页、底栏、服务与托盘注册、共享计数、清理和重新激活。要用同一套测试检查归档本身，可以解包后将 `KEM_PACKAGE_DIR` 指向解包得到的 `package` 目录，再从源码项目运行 `pnpm run test:client`。解包目录应位于源码项目下面，便于 Node 找到测试使用的 Svelte 依赖。

在 KEM 中人工验收：

1. 导入并启用 `.tgz`，打开导航「计数器」，确认页面与底栏显示相同计数及 Host revision。
2. 从页面、底栏和托盘分别点击「加一」，确认两处显示同步；切换导航再切回，确认计数保留。
3. 停用插件，确认导航项、底栏与托盘菜单一同消失；重新启用后计数归零。
