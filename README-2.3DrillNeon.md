# Get Started with Drizzle + Neon（npm 版）

## 專案基本結構

```text
<project root>
├  drizzle
├  src
│   ├  db
│   │  └  schema.ts
│   └  index.ts
├  .env
├  drizzle.config.ts
├  package.json
└  tsconfig.json
```

## Step 1 — 安裝套件（npm）

```bash
npm i drizzle-orm @neondatabase/serverless dotenv
npm i -D drizzle-kit tsx
```

## Step 2 — 設定環境變數

在專案根目錄建立 `.env`：

```env
DATABASE_URL=
```

將 Neon 提供的連線字串貼到 `DATABASE_URL`。 ([Drizzle ORM][1])

---

## Step 3 — 連接 Drizzle ORM（Neon）

建立 `src/index.ts`，使用 `neon-http` driver 初始化：

```ts
import { drizzle } from 'drizzle-orm/neon-http';

const db = drizzle(process.env.DATABASE_URL);
```

若需要「同步」連線方式，可先建立 Neon client 再交給 Drizzle：

```ts
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle({ client: sql });
```

## Step 4 — 建立資料表（Schema）

建立 `src/db/schema.ts`，宣告 `users` table：

```ts
import { integer, pgTable, varchar } from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  age: integer().notNull(),
  email: varchar({ length: 255 }).notNull().unique(),
});
```

## Step 5 — 設定 Drizzle Kit（drizzle.config.ts）

在專案根目錄建立 `drizzle.config.ts`：

```ts
import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  out: './drizzle',
  schema: './src/db/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

## Step 6 — 套用 Schema 變更到資料庫

### 方式 A：快速推送（適合快速迭代）

```bash
npx drizzle-kit push
```

### 方式 B：產生 migration 再套用（較正式流程）

```bash
npx drizzle-kit generate
npx drizzle-kit migrate
```

## Step 7 — 寫入/查詢範例（CRUD）

更新 `src/index.ts`，加入簡單 CRUD 範例：

```ts
import 'dotenv/config';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq } from 'drizzle-orm';
import { usersTable } from './db/schema';

const db = drizzle(process.env.DATABASE_URL!);

async function main() {
  const user: typeof usersTable.$inferInsert = {
    name: 'John',
    age: 30,
    email: 'john@example.com',
  };

  await db.insert(usersTable).values(user);
  console.log('New user created!');

  const users = await db.select().from(usersTable);
  console.log('Getting all users from the database: ', users);

  await db
    .update(usersTable)
    .set({ age: 31 })
    .where(eq(usersTable.email, user.email));
  console.log('User info updated!');

  await db.delete(usersTable).where(eq(usersTable.email, user.email));
  console.log('User deleted!');
}

main();
```

## Step 8 — 執行 TypeScript（npm）

```bash
npx tsx src/index.ts
```
