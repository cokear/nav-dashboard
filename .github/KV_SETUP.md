# KV 存储配置说明

## ✅ 已完成配置

KV 命名空间已自动创建并配置：

- **Namespace ID**: `cb261e73c6414283a804222054699019`
- **Binding**: `KV`
- **用途**: 图片存储

## 📋 GitHub Secrets 配置（简化版）

访问：https://github.com/debbide/nav-dashboard/settings/secrets/actions

现在只需要添加 **2个 Secrets**（移除了 R2 相关配置）：

### 1. CLOUDFLARE_API_TOKEN

**获取步骤**：
1. 访问 https://dash.cloudflare.com/profile/api-tokens
2. Create Token → Edit Cloudflare Workers
3. 复制 Token

**添加到 GitHub**：
- Name: `CLOUDFLARE_API_TOKEN`
- Secret: 粘贴 Token

### 2. CLOUDFLARE_ACCOUNT_ID

**获取步骤**：
1. 访问 https://dash.cloudflare.com
2. 右侧复制 Account ID

**添加到 GitHub**：
- Name: `CLOUDFLARE_ACCOUNT_ID`
- Secret: 粘贴 Account ID

### 3. D1_DATABASE_ID（可选）

**值**: `110c9d6b-52d7-4d2c-876b-1c6ba08f22d4`

---

## 🚀 部署步骤

配置完成后：

1. 访问：https://github.com/debbide/nav-dashboard/actions
2. 选择 **Deploy to Cloudflare**
3. 点击 **Run workflow**

## 🎯 KV vs R2 的优势

使用 KV 存储图片的优势：
- ✅ **简单配置** - 无需公共域名配置
- ✅ **统一访问** - 通过 Workers API 访问
- ✅ **自动缓存** - 边缘缓存
- ✅ **免费额度大** - 每天 100,000 次读取

限制：
- ⚠️ 单个文件最大 25MB（已限制上传 2MB）
- ⚠️ 适合小型项目

---

## 📝 配置清单

- [x] 创建 KV 命名空间
- [x] 更新 wrangler.toml
- [x] 修改 Workers 代码支持 KV
- [x] 更新 GitHub Actions
- [ ] 添加 GitHub Secrets
- [ ] 运行部署
