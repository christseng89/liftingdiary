# Setup and Claude

## Install Claude Code Introduction

npm install -g npm@latest
npm install -g @anthropic-ai/claude-code

claude --version
<!-- 2.0.74 (Claude Code) -->

## Create npx project

```cmd
npx create-next-app@latest liftingdiary
cd liftingdiary
code .

npm run dev

# In another terminal, run:
claude
  /theme
  /init
```

<http://localhost:3000> to see your new Next.js app.

## Clerk - Authentication and User Management

<https://clerk.com/>

- **Create application** -> Application name (**ClaudePro**) -> **Create application** -> **Copy prompt**
- Paste prompt into `claude` terminal and follow instructions.
  
  Would you like me to:
  1. Integrate Clerk into your Next.js application following these instructions?
  2. Update the CLAUDE.md file to reference these Clerk integration guidelines?
  3. Something else? => 1 & 2

### Edit `.gitignore` and `.env.local` files

```.gitignore
.claude
nul
```

```cmd
npm run dev
```

- Go to <http://localhost:3000> and test authentication flow.

## Next Steps

claude
    @app\layout.tsx line 42 - 45

  /terminal-setup
  Installed VSCode terminal Shift+Enter key binding

  press **alt+m** to cycle to **? for shortcuts**
  Is it possible to launch the sign in and sign up with clerk via a modal? Do not make any updates to the code.

  Would it be possible to use different class to show different colors for SignInButton (White) and 
SignUpButton (Blue)?

  /clear

---

## Context Windows in Claude Code（Claude Code 的上下文視窗）

本節說明 **Context Window（上下文視窗）** 的概念，以及在 **Claude Code** 使用情境下，它實際代表的意義與影響。

一般情況下，只要在 Claude Code 中執行一項「新的任務」，或要求 Claude Code 實作新的功能，建議從一個**全新的聊天視窗**開始，並使用 **`/clear` 指令** 清空既有對話內容。

無論是安裝套件、更新字型（font family），或是在應用程式中實作某項功能，實務上皆建議先確保聊天處於「空白狀態」。

這樣做主要基於以下兩個原因。

---

### 原因一：避免上下文污染（Context Pollution）

當需要實作兩個**彼此無關的功能**時，若在同一個聊天視窗中連續操作，第二個功能的 prompt 可能會受到第一個功能上下文的影響。

例如：

- 在同一個聊天視窗中，先使用 Claude Code 完成一個功能
- 接著，在相同聊天視窗中，要求 Claude Code 實作另一個「**完全無關**」的功能

此情況很容易導致：

> **前一個功能的上下文干擾後續功能的推理與輸出結果**

因此，建議的原則為：
👉 **每一項新功能，皆從全新的聊天開始**

---

### 原因二：Context Window 的容量限制

在使用像 Claude 這樣的大型語言模型時，**Context Window 本身具有容量上限**。

Context Window 可視為一個「容器」，其中只能容納**有限數量的文字內容**，包含：

- 系統上下文（System Context）
- Prompt（使用者輸入）
- 回應（Claude 的輸出）

當總內容超過該上限時，便會發生「溢出（overflow）」。

---

### 簡化示例說明

假設某一次 Claude Code 的對話即構成一個 Context Window。

在每一個聊天中：

- **`CLAUDE.md` 檔案會自動加入上下文**
  - 該檔案本身即佔用一部分 Context Window
- 接著是使用者輸入的 Prompt
- 然後是 Claude Code 所產生的回應

若回應內容較長，便會進一步消耗 Context Window 的可用空間。

當持續與 Claude Code 互動並提出新的問題，而後續 prompt 又比之前更長時，可能會出現以下情況：

> **新加入的內容超過 Context Window 的可用上限**

其結果包括：

- 最早的對話內容被「擠出」上下文
- Claude Code 開始「遺忘」先前的重要訊息

---

### 為什麼仍建議使用 `/clear`

儘管上述示例為簡化說明，實務上也不太可能因少量來回對話就立即耗盡 Context Window，但仍建議：

- 每次開始新任務時
- 使用 **`/clear`** 重置聊天內容

此作法可確保：

- 不產生上下文污染
- 避免意外觸及 Context Window 的容量限制
- Claude Code 的行為與輸出結果具有高度可預期性

---

### 另一項重要技巧：將任務拆解為小單位

在使用 Claude Code 進行開發時，建議將需求拆解為**較小的任務單位**。

亦即：

- 不一次要求 Claude Code 同時實作多個功能
- 而是一次僅專注完成單一小功能

此作法的優點包括：

- 降低 Context Window 的使用壓力
- 提高 Claude Code 成功完成任務的機率
- 使輸出結果更容易閱讀、分析與審查

---

### 小結

至此，已對 **Claude Code 中的 Context Window 概念及其管理方式** 建立基本理解。

在下一堂課中，將進行以下內容：

- 建立一個 **由 Neon 托管的 Postgres 資料庫**
- 在 **Next.js 專案中安裝 Drizzle**
- 開始介紹 **Claude Code 中的 MCP（Model Context Protocol）**

換言之，下一堂課將完成專案中所有與「資料庫相關」的基礎設定。

---

## Postgres Database with Neon and Drizzle ORM

<https://neon.com/>

- Project Name: LiftingDiary
- Region: Asia Pacific (Singapore)

Click **Create project**

**1 個 Workout → 多個 Exercises → 每個 Exercise 多個 Sets**。

---

## 一、概念結構（先看關係）

```structure
Workout
 ├─ Exercise 1
 │   ├─ Set 1
 │   ├─ Set 2
 │   └─ Set 3
 └─ Exercise 2
     ├─ Set 1
     └─ Set 2
```

---

## 二、實際例子（以一次訓練為例）

### 🏋️ Workout（一次訓練）

- 日期：2025-01-10
- 類型：Leg Day
- 備註：Felt strong today

---

#### 🏃 Exercises（訓練動作）

##### Exercise 1：Squat（深蹲）

| Set | 重量 (kg) | 次數 (reps) | 是否完成 |
| --- | --------- | ----------- | -------- |
| 1   | 100       | 5           | ✅       |
| 2   | 100       | 5           | ✅       |
| 3   | 110       | 3           | ✅       |

---

##### Exercise 2：Bench Press（臥推）

| Set | 重量 (kg) | 次數 (reps) | 是否完成 |
| --- | --------- | ----------- | -------- |
| 1   | 80        | 8           | ✅       |
| 2   | 80        | 8           | ✅       |

---

## 三、同一份資料，用「JSON 結構」表示（非常實務）

這種結構正是 Claude Code / Drizzle / API 很常用的形式：

```json
{
  "workout": {
    "id": 1,
    "date": "2025-01-10",
    "type": "Leg Day",
    "note": "Felt strong today",
    "exercises": [
      {
        "id": 10,
        "name": "Squat",
        "sets": [
          { "id": 100, "weight": 100, "reps": 5, "completed": true },
          { "id": 101, "weight": 100, "reps": 5, "completed": true },
          { "id": 102, "weight": 110, "reps": 3, "completed": true }
        ]
      },
      {
        "id": 11,
        "name": "Bench Press",
        "sets": [
          { "id": 103, "weight": 80, "reps": 8, "completed": true },
          { "id": 104, "weight": 80, "reps": 8, "completed": true }
        ]
      }
    ]
  }
}
```

---

## 四、資料庫表格設計思考、為什麼這個結構很重要？

因為它可以：

- 很自然地對應到 **SQL / Drizzle Schema**
- 很容易做：

  - 訓練紀錄查詢
  - 統計總訓練量（Volume）
  - 畫訓練進度圖表
- 非常適合 **Claude Code 直接生成資料表**

---

## Shadcn UI Design and Drizzle ORM

<https://ui.shadcn.com/docs/components>
<https://orm.drizzle.team/> -> **Getting Started** -> **Neon** -> <https://orm.drizzle.team/docs/get-started/neon-new>

### Step 1 - Install @neondatabase/serverless package

```cmd
npm i drizzle-orm @neondatabase/serverless dotenv
npm i -D drizzle-kit tsx
```

### Step 2 - Setup connection variables

```cmd
ren .env.local .env
```

```.env
DATABASE_URL=postgresql://neondb_owner:...
```

### Step 3 - Connect Drizzle ORM to the database

```cmd
md db
notepad db\index.ts
```

```ts index.ts
import { drizzle } from "drizzle-orm/neon-http";
const db = drizzle(process.env.DATABASE_URL!);

export { db };

```

### Step 4 - Create a table

Skipped to be generated by **Claude** Code later

```cmd
notepad db\schema.ts
```

### Step 5 - Setup Drizzle config file

```cmd
notepad drizzle.config.ts
```

```ts drizzle.config.ts
import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  out: './drizzle',
  schema: './db/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

### Step 5.1 - Setup Drizzle migration scripts

<https://ui.shadcn.com/docs/installation/next>

```cmd
npx shadcn@latest init
npx shadcn@latest add button
```
