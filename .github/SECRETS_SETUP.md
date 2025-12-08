# 4 个 Secrets 配置指南

## 📋 需要配置的 Secrets

访问：https://github.com/debbide/nav-dashboard/settings/secrets/actions

一次性添加以下 **4 个 Secrets**：

---

### 1. CLOUDFLARE_API_TOKEN

**获取步骤**：

1. 访问 https://dash.cloudflare.com/profile/api-tokens
2. 点击 **Create Token**
3. 使用模板 **Edit Cloudflare Workers**
4. 或自定义权限：
   - Account - Workers Scripts - Edit
   - Account - Cloudflare Pages - Edit
   - Account - D1 - Edit
   - Account - Workers KV Storage - Edit
5. 点击 **Create Token**
6. 复制 Token

**添加到 GitHub**：
- Name: `CLOUDFLARE_API_TOKEN`
- Secret: 粘贴 Token

---

### 2. CLOUDFLARE_ACCOUNT_ID

**获取步骤**：

1. 访问 https://dash.cloudflare.com
2. 右侧侧边栏可以看到 **Account ID**
3. 点击复制

**添加到 GitHub**：
- Name: `CLOUDFLARE_ACCOUNT_ID`
- Secret: 粘贴 Account ID

---

### 3. D1_DATABASE_ID

**获取步骤**：

```powershell
# 在本地执行（已登录 wrangler）
npx wrangler d1 list
```

找到 `nav-dashboard-db` 的 `uuid`，或者：

**如果数据库已创建**：
- 值：`110c9d6b-52d7-4d2c-876b-1c6ba08f22d4`（已有）

**如果需要新建**：
```powershell
npx wrangler d1 create nav-dashboard-db
```
复制输出的 `database_id`

**添加到 GitHub**：
- Name: `D1_DATABASE_ID`
- Secret: `110c9d6b-52d7-4d2c-876b-1c6ba08f22d4`

---

### 4. KV_NAMESPACE_ID

**获取步骤**：

```powershell
# 在本地执行
npx wrangler kv:namespace list
```

找到包含 `nav-images` 的命名空间 ID，或者：

**如果已创建**：
- 值：`cb261e73c6414283a804222054699019`（已有）

**如果需要新建**：
```powershell
npx wrangler kv:namespace create nav-images
```
复制输出的 `id`

**添加到 GitHub**：
- Name: `KV_NAMESPACE_ID`
- Secret: `cb261e73c6414283a804222054699019`

---

## ✅ 配置检查清单

确保添加了所有 4 个 Secrets：
- [ ] CLOUDFLARE_API_TOKEN
- [ ] CLOUDFLARE_ACCOUNT_ID
- [ ] D1_DATABASE_ID
- [ ] KV_NAMESPACE_ID

---

## 🚀 运行部署

配置完成后：

1. 访问：https://github.com/debbide/nav-dashboard/actions
2. 选择 **Deploy to Cloudflare**
3. 点击 **Run workflow** → **Run workflow**

---

## ⚙️ 首次部署后配置（一次性）

部署成功后，在 Cloudflare Dashboard 配置 Pages 绑定：

1. 访问 https://dash.cloudflare.com → **Pages** → **nav-dashboard**
2. 进入 **Settings** → **Functions**
3. 添加 **D1 database binding**:
   - Variable name: `DB`
   - D1 database: `nav-dashboard-db`
4. 添加 **KV namespace binding**:
   - Variable name: `KV`
   - KV namespace: 选择 ID 为 `cb261e73c6414283a804222054699019` 的命名空间
5. 点击 **Save**

---

## 🎉 完成

以后每次推送代码都会自动部署，无需任何手动操作！

访问：
- **主页**：https://nav-dashboard.pages.dev
- **管理后台**：https://nav-dashboard.pages.dev/admin.html

---

## 💡 快速配置（推荐）

如果本地已创建资源，直接使用这些值：

```
CLOUDFLARE_API_TOKEN = [从 Dashboard 创建]
CLOUDFLARE_ACCOUNT_ID = [从 Dashboard 获取]
D1_DATABASE_ID = 110c9d6b-52d7-4d2c-876b-1c6ba08f22d4
KV_NAMESPACE_ID = cb261e73c6414283a804222054699019
```

配置后立即运行部署即可！🚀
