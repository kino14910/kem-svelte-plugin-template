# KEM 客户端插件模板 · 示例计数器

这是一个 KEM API v1 客户端插件模板，使用 Svelte 5 + TypeScript + Vite 编写。它在 KEM 的 Renderer 中与宿主共享同一个 Cordis 树、同一份 Svelte 运行时和同一个 document，因此导航页、底栏和桌面贡献可以直接共享模块状态，不需要 iframe 或跨帧消息。

| 贡献 | 位置 | 说明 |
| --- | --- | --- |
| 导航页 | `src/ExamplePage.svelte` | 显示计数和 Host revision |
| 底栏 | `src/ExampleFooter.svelte` | 常驻主界面底部，与导航页共享计数 |
| 客户端服务 | `src/client.ts` | `ctx.provide('exampleCounter', …)`，供其他插件 `inject` |
| 托盘菜单 | `src/client.ts` | 通过 `useDesktop` 加一/重置 |
| 共享状态 | `src/example-store.ts` | 单一 store，被页面、底栏和托盘共同使用 |

## 本地开发

使用 Node.js 24 和 `package.json` 指定的 pnpm 版本，在项目根目录运行：

```sh
pnpm install --frozen-lockfile
pnpm dev
```

`pnpm dev` 以 watch 模式重建 `build/client.js`。用 `pnpm pack` 打出 `.tgz`，然后在 KEM 里通过「插件 → 导入本地插件」导入。

| 要修改的内容 | 文件 |
| --- | --- |
| 导航页 | `src/ExamplePage.svelte` |
| 底栏 | `src/ExampleFooter.svelte` |
| 共享状态 | `src/example-store.ts` |
| 贡献注册、服务、托盘 | `src/client.ts` |
| 插件 ID、标题、入口 | `package.json` 的 `kem` 字段 |
| KEM Host 端逻辑 | `host.mjs`，纯界面插件可保留空的默认导出 |

## 最新 KEM 运行时契约

- 导航页和底栏都会收到 `{ snapshot }`，包含 Host 的 `bootId` 和 `revision`；示例页与底栏直接显示 `snapshot.revision`。
- 界面贡献在 `apply(ctx)` 中注册，绑定到插件 Fiber；停用、升级、卸载或 Host 重载时一起回收。
- 客户端服务通过 `ctx.provide(name, value)` 暴露，其他客户端插件用 `inject: ['name']` 消费；服务随 Fiber 注销，依赖方会自动卸载。
- 同一 bundle 内的导航页与底栏共享模块状态；跨插件共享请使用服务。

## 构建契约

`pnpm run build` 用 Vite 产出单文件 IIFE，再由 `scripts/package-client.mjs` 校验并复制到 `dist/client.js`。

- 产物形如 `var __KEM_CLIENT_PLUGIN__ = (function (…) {…})(…)`，导出 Cordis 插件。
- `svelte`、`svelte/internal/client`、`svelte/store`、`svelte/reactivity`、`svelte/internal/disclose-version` 必须保持 external，由宿主通过 `KEM_PLATFORM` 注入唯一副本。混入第二份 Svelte 会让响应式失效。
- 组件样式内联进 bundle（`css: 'injected'`），`dist/` 只允许 `client.js`。
- 大小上限 4 MiB，超限或 `dist/` 出现其他文件时构建失败。

## 验收

```sh
pnpm run check   # TypeScript + Svelte
pnpm test        # 构建 + 校验 bundle 契约与注册行为
pnpm run build   # 只构建
```

`pnpm test` 会在仓库内构建，检查产物没有残留 ESM 语法、没有旁路 CSS 资产，然后把 bundle 放进真实 Svelte 运行时与伪 `window` 中求值，确认：

- 导出 `{ inject: ['navRail', 'surfaces'], apply }`；
- 导航页、底栏、`exampleCounter` 服务和托盘菜单注册在同一 Fiber；
- 托盘动作修改的计数与界面读取的是同一个 store；
- Fiber 释放时关闭桌面作用域。

在 KEM 里的人工验收：

1. 启用插件，打开导航「计数器」，页面与底栏显示相同计数。
2. 点击页面或底栏的「加一」，两处数字同步；点击托盘「加一」也同步。
3. 切到其他导航页再切回，底栏保持挂载、计数不丢。
4. 停用插件，导航项、底栏和托盘菜单同时消失；重新启用后计数归零。

## 创建和发布插件

1. 复制本仓库，修改 `package.json` 的包名、版本、作者和描述；把 `kem.id` 换成自己的唯一标识（小写字母开头，可含小写字母、数字和连字符，最长 64 个字符），并更新 `kem.title`、`kem.description`、`kem.client.label`。
2. 运行 `pnpm pack`。它会重新构建，并把 `dist/client.js` 和 `host.mjs` 连同包清单、README 打进 `.tgz`。
3. 准备发布时移除 `private: true`，发布到目标 npm registry，再把包名和版本加入 KEM 市场索引。

`kem.client.entry` 必须指向包内以 `./` 开头、以 `.js` 或 `.mjs` 结尾的文件。KEM 按包内 `package.json` 的 `kem` 声明核对插件 ID、版本与 API 版本，读取上限 4 MiB 的 UTF-8 源码后在 Renderer 中求值。
