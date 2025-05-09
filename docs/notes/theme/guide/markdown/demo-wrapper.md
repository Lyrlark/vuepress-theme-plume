---
title: 示例容器
createTime: 2024/09/30 14:47:12
icon: icon-park-outline:eyes
permalink: /guide/markdown/demo-wrapper/
outline: 2
---

## 概述

有时候，你可能需要在 内容中补充一些 示例，但期望能与 其它内容 分隔开来呈现。
主题支持在 Markdown 文件中添加示例容器。

## 语法

````md
::: demo-wrapper
添加你的示例
:::
````

## 选项

- `title="xxx"`：标题
- `no-padding`：不添加内边距
- `img`: 仅包含图片时使用
- `height="xxx"`: 高度

## 示例

仅包含图片:

```md
::: demo-wrapper img no-padding
![hero](/images/custom-hero.jpg)
:::
```

**输出：**
::: demo-wrapper img no-padding
![hero](/images/custom-hero.jpg)
:::

包含 markdown 语法：

```md
::: demo-wrapper title="标题"
### 三级标题

这是示例容器中的内容。
:::
```

**输出：**
::: demo-wrapper title="标题"

### 三级标题

这是示例容器中的内容。
:::

包含 html /vue 代码：

```md
::: demo-wrapper
<h1 class="your-demo-title">这是标题</h1>
<p class="your-demo-paragraph">这是段落</p>

<style>
  .your-demo-title {
    color: red;
  }
  .your-demo-paragraph {
    color: blue;
  }
</style>
:::
```

**输出：**
::: demo-wrapper

<h1 class="your-demo-title">这是标题</h1>
<p class="your-demo-paragraph">这是段落</p>

<style>
  .your-demo-title {
    color: red !important;
  }
  .your-demo-paragraph {
    color: blue !important;
  }
</style>

:::
