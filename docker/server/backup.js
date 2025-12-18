/**
 * WebDAV 备份模块
 * 支持定时自动备份和手动备份/恢复
 */

const { createClient } = require('webdav');
const cron = require('node-cron');

let webdavClient = null;
let cronJob = null;

// 获取备份配置
function getBackupConfig(db) {
    const config = {};
    const keys = ['webdav_url', 'webdav_username', 'webdav_password', 'backup_frequency', 'last_backup_time', 'last_backup_status'];

    for (const key of keys) {
        const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
        config[key] = row ? row.value : null;
    }

    return config;
}

// 保存备份配置
function saveBackupConfig(db, config) {
    const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');

    if (config.webdav_url !== undefined) {
        stmt.run('webdav_url', config.webdav_url);
    }
    if (config.webdav_username !== undefined) {
        stmt.run('webdav_username', config.webdav_username);
    }
    if (config.webdav_password !== undefined) {
        stmt.run('webdav_password', config.webdav_password);
    }
    if (config.backup_frequency !== undefined) {
        stmt.run('backup_frequency', config.backup_frequency);
    }
}

// 更新备份状态
function updateBackupStatus(db, status, time = null) {
    const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
    stmt.run('last_backup_status', status);
    if (time) {
        stmt.run('last_backup_time', time);
    }
}

// 创建 WebDAV 客户端
function createWebDAVClient(url, username, password) {
    try {
        webdavClient = createClient(url, {
            username,
            password
        });
        return webdavClient;
    } catch (error) {
        console.error('创建 WebDAV 客户端失败:', error.message);
        return null;
    }
}

// 导出数据为 JSON
function exportData(db) {
    const categories = db.prepare('SELECT * FROM categories ORDER BY sort_order ASC').all();
    const sites = db.prepare('SELECT * FROM sites ORDER BY sort_order ASC').all();

    // 获取非敏感设置
    const settings = {};
    const rows = db.prepare("SELECT key, value FROM settings WHERE key NOT IN ('admin_password', 'webdav_password')").all();
    for (const row of rows) {
        settings[row.key] = row.value;
    }

    return {
        exportTime: new Date().toISOString(),
        version: '1.0',
        categories,
        sites,
        settings
    };
}

// 执行备份
async function performBackup(db) {
    const config = getBackupConfig(db);

    if (!config.webdav_url || !config.webdav_username || !config.webdav_password) {
        throw new Error('WebDAV 配置不完整');
    }

    // 创建客户端
    const client = createWebDAVClient(config.webdav_url, config.webdav_username, config.webdav_password);
    if (!client) {
        throw new Error('无法创建 WebDAV 客户端');
    }

    // 导出数据
    const data = exportData(db);
    const jsonContent = JSON.stringify(data, null, 2);

    // 文件名：nav-dashboard-backup-YYYYMMDD.json
    const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const filename = `nav-dashboard-backup-${date}.json`;

    // 上传到 WebDAV
    await client.putFileContents(`/${filename}`, jsonContent, {
        contentLength: Buffer.byteLength(jsonContent, 'utf8'),
        overwrite: true
    });

    // 更新状态
    const now = new Date().toISOString();
    updateBackupStatus(db, 'success', now);

    console.log(`备份成功: ${filename}`);
    return { success: true, filename, time: now };
}

// 从 WebDAV 获取备份文件列表
async function listBackups(db) {
    const config = getBackupConfig(db);

    if (!config.webdav_url || !config.webdav_username || !config.webdav_password) {
        throw new Error('WebDAV 配置不完整');
    }

    const client = createWebDAVClient(config.webdav_url, config.webdav_username, config.webdav_password);
    if (!client) {
        throw new Error('无法创建 WebDAV 客户端');
    }

    // 列出目录内容
    const items = await client.getDirectoryContents('/');

    // 过滤出备份文件
    const backups = items
        .filter(item => item.basename.startsWith('nav-dashboard-backup-') && item.basename.endsWith('.json'))
        .map(item => ({
            filename: item.basename,
            size: item.size,
            lastModified: item.lastmod
        }))
        .sort((a, b) => b.filename.localeCompare(a.filename)); // 按文件名倒序

    return backups;
}

// 从 WebDAV 恢复数据
async function restoreBackup(db, filename) {
    const config = getBackupConfig(db);

    if (!config.webdav_url || !config.webdav_username || !config.webdav_password) {
        throw new Error('WebDAV 配置不完整');
    }

    const client = createWebDAVClient(config.webdav_url, config.webdav_username, config.webdav_password);
    if (!client) {
        throw new Error('无法创建 WebDAV 客户端');
    }

    // 下载文件
    const content = await client.getFileContents(`/${filename}`, { format: 'text' });
    const data = JSON.parse(content);

    // 验证数据格式
    if (!data.categories || !data.sites) {
        throw new Error('备份文件格式无效');
    }

    // 导入数据
    const importCategories = db.transaction((categories) => {
        db.prepare('DELETE FROM categories').run();
        const stmt = db.prepare('INSERT INTO categories (id, name, icon, color, sort_order) VALUES (?, ?, ?, ?, ?)');
        for (const cat of categories) {
            stmt.run(cat.id, cat.name, cat.icon || '', cat.color || '#ff9a56', cat.sort_order || 0);
        }
    });

    const importSites = db.transaction((sites) => {
        db.prepare('DELETE FROM sites').run();
        const stmt = db.prepare('INSERT INTO sites (id, name, url, description, logo, category_id, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)');
        for (const site of sites) {
            stmt.run(site.id, site.name, site.url, site.description || '', site.logo || '', site.category_id, site.sort_order || 0);
        }
    });

    importCategories(data.categories);
    importSites(data.sites);

    // 导入设置（排除密码）
    if (data.settings) {
        const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
        for (const [key, value] of Object.entries(data.settings)) {
            if (key !== 'admin_password' && key !== 'webdav_password') {
                stmt.run(key, value);
            }
        }
    }

    console.log(`恢复成功: ${filename}`);
    return { success: true, categories: data.categories.length, sites: data.sites.length };
}

// 设置定时备份
function setupScheduledBackup(db) {
    // 先停止现有任务
    if (cronJob) {
        cronJob.stop();
        cronJob = null;
    }

    const config = getBackupConfig(db);
    const frequency = config.backup_frequency;

    if (!frequency || frequency === 'off') {
        console.log('定时备份已关闭');
        return;
    }

    let cronExpression;
    if (frequency === 'daily') {
        cronExpression = '0 3 * * *'; // 每天凌晨3点
    } else if (frequency === 'weekly') {
        cronExpression = '0 3 * * 0'; // 每周日凌晨3点
    } else {
        console.log(`未知的备份频率: ${frequency}`);
        return;
    }

    cronJob = cron.schedule(cronExpression, async () => {
        console.log(`执行定时备份 (${frequency})...`);
        try {
            await performBackup(db);
        } catch (error) {
            console.error('定时备份失败:', error.message);
            updateBackupStatus(db, `failed: ${error.message}`);
        }
    });

    console.log(`定时备份已设置: ${frequency} (${cronExpression})`);
}

// 测试 WebDAV 连接
async function testConnection(url, username, password) {
    try {
        const client = createClient(url, { username, password });
        await client.getDirectoryContents('/');
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

module.exports = {
    getBackupConfig,
    saveBackupConfig,
    performBackup,
    listBackups,
    restoreBackup,
    setupScheduledBackup,
    testConnection
};
