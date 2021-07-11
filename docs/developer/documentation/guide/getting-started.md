# 快速上手

## 依赖环境

- [Node.js v12+](https://nodejs.org/)
- [Yarn v1 classic](https://classic.yarnpkg.com/zh-Hans/) （可选）

## Setup

## Clone & Install dep

- **步骤 1**: 将远程仓库 Clone 到本地

```shell
git clone https://github.com/jiazengp/genshinmap-docs

cd genshinmap-docs
```

- **步骤 2**: 将安装本地依赖

<CodeGroup>
  <CodeGroupItem title="YARN" active>

```bash
yarn
```

  </CodeGroupItem>

  <CodeGroupItem title="NPM">

```bash
# 请不要使用 CNPM！
npm install
```

  </CodeGroupItem>

  <CodeGroupItem title="PNPM">

```bash
pnpm install
```

  </CodeGroupItem>
</CodeGroup>

## DevServe

- **在本地启动开发服务器**

<CodeGroup>
  <CodeGroupItem title="YARN" active>

```bash
yarn docs:dev
```

  </CodeGroupItem>

  <CodeGroupItem title="NPM">

```bash
npm run docs:dev
```

  </CodeGroupItem>

  <CodeGroupItem title="PNPM">

```bash
pnpm run docs:dev
```

  </CodeGroupItem>
</CodeGroup>

完成后会在 `http://localhost:8080` 启动一个热重载的开发服务器。当你修改你的 Markdown 文件时，浏览器中的内容也会自动更新。

### Build

- **打包编译本地文档**

<CodeGroup>
  <CodeGroupItem title="YARN" active>

```bash
yarn docs:build2
```

  </CodeGroupItem>

  <CodeGroupItem title="NPM">

```bash
npm run docs:build2
```

  </CodeGroupItem>

  <CodeGroupItem title="PNPM">

```bash
pnpm run docs:build2
```

  </CodeGroupItem>
</CodeGroup>

### Commit

- **暂存更改**

```shell
git add .
```

- **合并冲突**

```shell
git fetch origin master:tmp

git diff tmp

git merge tmp

git branch -d temp
```

- **提交**

<CodeGroup>
  <CodeGroupItem title="YARN" active>

```bash
yarn docs:commit
```

  </CodeGroupItem>

  <CodeGroupItem title="NPM">

```bash
npm run docs:commit
```

  </CodeGroupItem>

  <CodeGroupItem title="PNPM">

```bash
pnpm run docs:commit
```

  </CodeGroupItem>
</CodeGroup>

- **推送**

```shell
git push -u origin master
```
