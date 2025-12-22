# Why Clear the Context Window in Claude Code?

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
