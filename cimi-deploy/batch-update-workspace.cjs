#!/usr/bin/env node
/**
 * Coder Workspace 批量版本更新工具
 *
 * 使用方法:
 *   node batch-update-workspaces.cjs [options]
 *
 * 参数:
 *   --env <test|prod>        环境，默认test (可选)
 *   --coder-url <url>        Coder 服务器地址 (可选，优先级高于环境配置)
 *   --token <token>          Coder Session Token (可选，优先级高于环境配置)
 *   --template <name>        模板名称 (可选，优先级高于环境配置)
 *   --template-version <id>  目标模板版本ID (可选，未指定则交互式选择)
 *   --user <username>        Coder用户名 (可选，优先级高于环境配置)
 *   --workspaces <names>     指定workspace名称列表，逗号分隔 (可选)
 *   --batch-size <n>         每批处理的workspace数量，默认5 (可选)
 *   --interval <ms>          批次间隔时间(毫秒)，默认2000 (可选)
 *   --status-filter <status> 只更新指定状态的workspace，如running,stopped (可选)
 *   --dry-run                仅预览，不实际执行 (可选)
 *   --verbose                显示详细日志 (可选)
 *   --help, -h               显示帮助
 *
 * 环境变量配置:
 *   CODER_TEST_URL, CODER_TEST_TOKEN, CODER_TEST_USER, CODER_TEST_TEMPLATE
 *   CODER_PROD_URL, CODER_PROD_TOKEN, CODER_PROD_USER, CODER_PROD_TEMPLATE
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');
const readline = require('readline');
const crypto = require('crypto');

// 环境配置
const CONFIG = {
  test: {
    url: process.env.CODER_TEST_URL || 'https://t-agi-coder.cdtp.com',
    user: process.env.CODER_TEST_USER || 'jansen-yin',
    template: process.env.CODER_TEST_TEMPLATE || '8bcfdabb-2e80-47f7-9190-ffa695092f39',
    token: process.env.CODER_TEST_TOKEN || '9EG8qe4H1T-aKjaFYPeDTYKfSCxL0GRc3'
  },
  prod: {
    url: process.env.CODER_PROD_URL || 'https://agi-coder.cxmt.com/',
    user: process.env.CODER_PROD_USER || 'cimi',
    template: process.env.CODER_PROD_TEMPLATE || '8488cee6-cf8c-4cbb-8686-4d67accc76e6',
    token: process.env.CODER_PROD_TOKEN || 'OsGRNYqx1s-csGrGf3KhFF2lD4T1LWMYt'
  }
};

// 解析命令行参数
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    env: 'test',
    batchSize: 5,
    interval: 2000,
    dryRun: false,
    verbose: false,
    workspaces: null,
    statusFilter: null,
    templateVersion: null
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    let key, value;

    if (arg.includes('=')) {
      const separatorIndex = arg.indexOf('=');
      key = arg.slice(0, separatorIndex);
      value = arg.slice(separatorIndex + 1);
    } else {
      key = arg;
      value = args[++i];
    }

    switch (key) {
      case '--env':
        options.env = value;
        break;
      case '--coder-url':
        options.coderUrl = value;
        break;
      case '--token':
        options.token = value;
        break;
      case '--template':
        options.template = value;
        break;
      case '--template-version':
        options.templateVersion = value;
        break;
      case '--user':
        options.user = value;
        break;
      case '--workspaces':
        options.workspaces = value.split(',').map(s => s.trim()).filter(Boolean);
        break;
      case '--batch-size':
        options.batchSize = parseInt(value) || 5;
        break;
      case '--interval':
        options.interval = parseInt(value) || 2000;
        break;
      case '--status-filter':
        options.statusFilter = value.split(',').map(s => s.trim());
        break;
      case '--dry-run':
        options.dryRun = true;
        break;
      case '--verbose':
        options.verbose = true;
        break;
      case '--help':
      case '-h':
        showHelp();
        process.exit(0);
        break;
    }
  }

  // 环境参数合并
  const envConfig = CONFIG[options.env] || CONFIG.test;
  options.coderUrl = options.coderUrl || envConfig.url;
  options.user = options.user || envConfig.user;
  options.template = options.template || envConfig.template;
  options.token = options.token || envConfig.token;

  // 验证必填参数
  if (!options.coderUrl || !options.token || !options.template) {
    console.error('错误: 缺少必填参数');
    console.error('  需要提供 --coder-url, --token, --template，或通过环境变量配置');
    console.error('\n使用 --help 查看详细帮助');
    process.exit(1);
  }

  if (!['test', 'prod'].includes(options.env)) {
    console.error('错误: 环境参数只能是 test 或 prod');
    process.exit(1);
  }

  return options;
}

function showHelp() {
  console.log(`
Coder Workspace 批量版本更新工具

使用方法:
  node batch-update-workspaces.cjs [options]

必填参数（可通过参数或环境变量指定）:
  --coder-url <url>        Coder 服务器地址
  --token <token>          Coder Session Token
  --template <name>        模板名称或模板ID
  --user <username>        Coder用户名

可选参数:
  --env <test|prod>        环境，默认test
  --template-version <id>  目标版本ID (未指定则交互式选择)
  --workspaces <names>     指定workspace名称列表
  --batch-size <n>         每批数量，默认5
  --interval <ms>          批次间隔，默认2000
  --status-filter <status> 状态过滤
  --dry-run                预览模式
  --verbose                详细日志
  --help, -h               帮助

环境变量:
  test: CODER_TEST_URL, CODER_TEST_TOKEN, CODER_TEST_USER, CODER_TEST_TEMPLATE
  prod: CODER_PROD_URL, CODER_PROD_TOKEN, CODER_PROD_USER, CODER_PROD_TEMPLATE

示例:
  # 交互式选择版本（引导式操作）
  node batch-update-workspaces.cjs --env=test

  # 指定版本更新
  node batch-update-workspaces.cjs --template-version=abc-123

  # 指定workspace列表
  node batch-update-workspaces.cjs --workspaces="ws1,ws2,ws3"

  # 预览模式（不实际执行）
  node batch-update-workspaces.cjs --dry-run

  # 生产环境操作
  node batch-update-workspaces.cjs --env=prod --template-version=xyz-789

  # 只更新正在运行的workspace
  node batch-update-workspaces.cjs --status-filter=running

  # 只更新已停止的workspace
  node batch-update-workspaces.cjs --status-filter=stopped

  # 自定义批次大小和间隔
  node batch-update-workspaces.cjs --batch-size=20 --interval=5000

  # 详细日志输出
  node batch-update-workspaces.cjs --verbose

  # 组合使用：生产环境 + 指定版本 + 只更新运行的 + 预览
  node batch-update-workspaces.cjs --env=prod --template-version=xyz-789 --status-filter=running --dry-run

  # 指定workspace并强制执行（非预览）
  node batch-update-workspaces.cjs --workspaces="dev-01,dev-02" --template-version=abc-123

`);
}

// HTTP 请求封装
function request(method, urlPath, body = null, token, baseUrl) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlPath, baseUrl);
    const client = url.protocol === 'https:' ? https : http;

    const reqOptions = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Coder-Session-Token': token,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      // 禁用SSL证书验证（内部环境）
      rejectUnauthorized: false,
      // 允许不安全的旧 TLS 重协商
      secureOptions: crypto.constants.SSL_OP_LEGACY_SERVER_CONNECT
    };

    if (options.verbose) {
      console.log(`[HTTP] ${method} ${urlPath}`);
    }

    const req = client.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const statusCode = res.statusCode;
          if (statusCode >= 200 && statusCode < 300) {
            resolve(data ? JSON.parse(data) : null);
          } else {
            reject(new Error(`HTTP ${statusCode}: ${data}`));
          }
        } catch (e) {
          reject(new Error(`解析响应失败: ${e.message}`));
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

// 获取模板的所有版本
async function getTemplateVersions(templateId, token, baseUrl) {
  try {
    const data = await request('GET', `/api/v2/templates/${templateId}/versions`, null, token, baseUrl);
    return data || [];
  } catch (error) {
    console.error(`获取模板 ${templateId} 版本列表失败: ${error.message}`);
    throw error;
  }
}

// 交互式选择版本
async function selectTemplateVersion(templateId, token, baseUrl) {
  console.log(`\n获取模板 "${templateId}" 的版本列表...`);

  const versions = await getTemplateVersions(templateId, token, baseUrl);

  if (!versions || versions.length === 0) {
    console.error('错误: 模板没有可用的版本');
    process.exit(1);
  }

  const sortedVersions = versions
    .sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at) : new Date(0);
      const dateB = b.created_at ? new Date(b.created_at) : new Date(0);
      return dateB - dateA;
    })
    .slice(0, 5);

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('可用版本列表（按创建时间倒序）:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  sortedVersions.forEach((v, index) => {
    const createdAt = v.created_at ? new Date(v.created_at).toLocaleString() : 'unknown';
    console.log(`  ${index + 1}. ${v.name || '(无名称)'} (${v.id})`);
    console.log(`     创建: ${createdAt}`);
  });

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve, reject) => {
    rl.question('\n请选择版本编号 (1-5): ', (answer) => {
      rl.close();

      const index = parseInt(answer) - 1;
      if (isNaN(index) || index < 0 || index >= sortedVersions.length) {
        reject(new Error('无效的选择'));
        return;
      }

      const selected = sortedVersions[index];
      console.log(`\n已选择版本: ${selected.name || '(无名称)'} (${selected.id})`);
      resolve(selected.id);
    });
  });
}

// 获取指定用户的所有 workspaces
async function getAllWorkspaces(user, templateName, token, statusFilter, baseUrl) {
  const workspaces = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    try {
      const offset = (page - 1) * 50;
      const query = `owner:me template:"${templateName}"`;
      const urlPath = `/api/v2/workspaces?q=${encodeURIComponent(query)}&limit=50&offset=${offset}`;
      const fullUrl = `${baseUrl}${urlPath}`;

      if (options.verbose) {
        console.log(`[请求] ${fullUrl}`);
      }

      const data = await request('GET', urlPath, null, token, baseUrl);

      if (!data.workspaces || data.workspaces.length === 0) {
        hasMore = false;
        break;
      }

      for (const ws of data.workspaces) {
        if (statusFilter && !statusFilter.includes(ws.status)) {
          if (options.verbose) {
            console.log(`[过滤] ${ws.name} 状态 ${ws.status} 不符合条件`);
          }
          continue;
        }

        const versionName = ws.latest_build?.template_version_name || null;
        const versionId = ws.latest_build?.template_version_id || null;

        workspaces.push({
          id: ws.id,
          name: ws.name,
          status: ws.status,
          templateVersionId: versionId,
          templateVersionName: versionName
        });
      }

      // 使用返回数量判断是否还有更多数据
      const returnedCount = data.workspaces ? data.workspaces.length : 0;
      hasMore = returnedCount === 50;
      page++;
    } catch (error) {
      console.error(`获取workspace列表失败: ${error.message}`);
      throw error;
    }
  }

  return workspaces;
}

// 通过名称获取 workspace 详情
async function getWorkspaceByName(user, workspaceName, token, baseUrl) {
  try {
    const data = await request('GET', `/api/v2/users/${user}/workspace/${workspaceName}`, null, token, baseUrl);
    const versionName = data.latest_build?.template_version_name || null;
    const versionId = data.latest_build?.template_version_id || null;
    return {
      id: data.id,
      name: data.name,
      status: data.status,
      templateVersionId: versionId,
      templateVersionName: versionName
    };
  } catch (error) {
    console.error(`获取 workspace ${workspaceName} 失败: ${error.message}`);
    return null;
  }
}

// 按版本分组workspace
function groupWorkspacesByVersion(workspaces) {
  const groups = new Map();

  for (const ws of workspaces) {
    if (ws.templateVersionId && ws.templateVersionName) {
      const key = `${ws.templateVersionId}|${ws.templateVersionName}`;
      if (!groups.has(key)) {
        groups.set(key, {
          id: ws.templateVersionId,
          name: ws.templateVersionName,
          workspaces: []
        });
      }
      groups.get(key).workspaces.push(ws);
    } else {
      // 没有版本信息的单独分组
      const unknownKey = 'unknown';
      if (!groups.has(unknownKey)) {
        groups.set(unknownKey, {
          id: null,
          name: '(未知版本)',
          workspaces: []
        });
      }
      groups.get(unknownKey).workspaces.push(ws);
    }
  }

  return Array.from(groups.values());
}

// 选择要更新的版本分组
async function selectVersionGroups(versionGroups) {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('当前 workspace 按版本分组:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  console.log('  0. [全部] 更新所有 workspace');
  versionGroups.forEach((group, index) => {
    const versionLabel = group.id ? `${group.name} (${group.id})` : group.name;
    const wsNames = group.workspaces.map(ws => ws.name).join(', ');
    console.log(`  ${index + 1}. [${group.workspaces.length}] ${versionLabel}`);
    console.log(`     ${wsNames}`);
  });
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve, reject) => {
    rl.question('\n请选择要更新的版本编号 (0表示全部, 多选用逗号分隔): ', (answer) => {
      rl.close();

      if (answer.trim() === '0') {
        // 全部
        const allWorkspaces = versionGroups.flatMap(g => g.workspaces);
        resolve(allWorkspaces);
        return;
      }

      const selectedIndices = answer.split(',')
        .map(s => parseInt(s.trim()) - 1)
        .filter(n => !isNaN(n) && n >= 0 && n < versionGroups.length);

      if (selectedIndices.length === 0) {
        reject(new Error('无效的选择'));
        return;
      }

      const selectedWorkspaces = selectedIndices.flatMap(i => versionGroups[i].workspaces);
      resolve(selectedWorkspaces);
    });
  });
}

// 确认是否更新
async function confirmUpdate(selectedWsNames, totalCount, targetVersion, dryRun) {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`已选择 ${selectedWsNames.length} 个 workspace (共${totalCount}个):`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(selectedWsNames.join(', '));
  console.log(`将更新至版本: ${targetVersion.name} (${targetVersion.id})`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  if (dryRun) {
    console.log('【预览模式】不会实际执行更新');
    return false;
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(`\n确认更新这 ${selectedWsNames.length} 个 workspace? [y/N]: `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

// 触发 workspace 更新
async function updateWorkspace(workspace, templateVersionId, token, baseUrl) {
  try {
    const body = {
      transition: 'start',
      template_version_id: templateVersionId
    };

    const result = await request('POST', `/api/v2/workspaces/${workspace.id}/builds`, body, token, baseUrl);
    return {
      success: true,
      buildId: result.id,
      status: result.status
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// 处理单个 workspace
async function processWorkspace(workspace, templateVersionId, token, baseUrl, dryRun) {
  if (dryRun) {
    console.log(`[预览] ${workspace.name} → 版本 ${templateVersionId}`);
    return { name: workspace.name, success: true, dryRun: true };
  }

  const updateResult = await updateWorkspace(workspace, templateVersionId, token, baseUrl);

  if (!updateResult.success) {
    console.log(`[失败] ${workspace.name}: ${updateResult.error}`);
    return { name: workspace.name, success: false, error: updateResult.error };
  }

  console.log(`[成功] ${workspace.name} (Build ID: ${updateResult.buildId})`);
  return {
    name: workspace.name,
    success: true,
    buildId: updateResult.buildId
  };
}

// 批处理 workspace（串行处理）
async function processBatch(workspaces, templateVersionId, token, baseUrl, dryRun) {
  const results = [];
  for (const ws of workspaces) {
    const result = await processWorkspace(ws, templateVersionId, token, baseUrl, dryRun);
    results.push(result);
  }
  return results;
}

// 延迟函数
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 主函数
async function main() {
  const opts = parseArgs();
  global.options = opts;

  console.log('='.repeat(60));
  console.log('Coder Workspace 批量版本更新工具');
  console.log('='.repeat(60));
  console.log(`环境: ${opts.env.toUpperCase()}`);
  console.log(`Coder URL: ${opts.coderUrl}`);
  console.log(`用户: ${opts.user}`);
  console.log(`模板: ${opts.template}`);
  console.log(`批次大小: ${opts.batchSize}`);
  console.log(`批次间隔: ${opts.interval}ms`);
  if (opts.statusFilter) console.log(`状态过滤: ${opts.statusFilter.join(', ')}`);
  if (opts.dryRun) console.log(`预览模式: 是`);
  console.log('='.repeat(60));

  // 1. 获取模板信息（id和name）
  let templateId = opts.template;
  let templateName = opts.template;
  try {
    const templateData = await request('GET', `/api/v2/templates/${opts.template}`, null, opts.token, opts.coderUrl);
    if (templateData && templateData.id) {
      templateId = templateData.id;
      templateName = templateData.name;
    }
  } catch (e) {
    // 如果获取失败，可能是传入的已经是 template id，继续使用
  }
  console.log(`模板 ID: ${templateId}`);
  console.log(`模板 Name: ${templateName}`);

  // 2. 选择目标版本（如果没有指定）
  let targetVersion = null;
  if (!opts.templateVersion) {
    try {
      const targetVersionId = await selectTemplateVersion(templateId, opts.token, opts.coderUrl);
      opts.templateVersion = targetVersionId;
    } catch (error) {
      console.error(`选择版本失败: ${error.message}`);
      process.exit(1);
    }
  }

  // 获取目标版本的详细信息（用于显示名称）
  const allVersions = await getTemplateVersions(templateId, opts.token, opts.coderUrl);
  targetVersion = allVersions.find(v => v.id === opts.templateVersion) || {
    id: opts.templateVersion,
    name: '(未知版本)'
  };

  console.log(`\n目标版本: ${targetVersion.name} (${targetVersion.id})`);

  // 3. 获取 workspace 列表
  let workspaces = [];

  if (opts.workspaces && opts.workspaces.length > 0) {
    console.log(`\n获取指定的 workspace 列表...`);
    for (const name of opts.workspaces) {
      const ws = await getWorkspaceByName(opts.user, name, opts.token, opts.coderUrl);
      if (ws) {
        if (opts.statusFilter && !opts.statusFilter.includes(ws.status)) {
          console.log(`  [跳过] ${name} 状态 ${ws.status} 不符合过滤条件`);
          continue;
        }
        workspaces.push(ws);
      } else {
        console.log(`  [警告] 未找到 workspace: ${name}`);
      }
    }
  } else {
    console.log('\n正在获取 workspace 列表...');
    workspaces = await getAllWorkspaces(opts.user, templateName, opts.token, opts.statusFilter, opts.coderUrl);
    console.log(`共找到 ${workspaces.length} 个 workspace`);
  }

  if (workspaces.length === 0) {
    console.log('没有找到符合条件的 workspace');
    return;
  }

  // 4. 按版本分组并让用户选择
  const versionGroups = groupWorkspacesByVersion(workspaces);
  const selectedWorkspaces = await selectVersionGroups(versionGroups);

  // 5. 确认更新
  const selectedWsNames = selectedWorkspaces.map(ws => ws.name);
  const confirmed = await confirmUpdate(selectedWsNames, workspaces.length, targetVersion, opts.dryRun);
  if (!confirmed) {
    console.log('已取消更新');
    return;
  }

  // 6. 分批处理
  const batches = [];
  for (let i = 0; i < selectedWorkspaces.length; i += opts.batchSize) {
    batches.push(selectedWorkspaces.slice(i, i + opts.batchSize));
  }

  console.log(`\n开始更新，共 ${batches.length} 批`);

  const allResults = [];

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    console.log(`\n[批次 ${i + 1}/${batches.length}] 触发 ${batch.length} 个 workspace`);

    const results = await processBatch(
      batch,
      opts.templateVersion,
      opts.token,
      opts.coderUrl,
      opts.dryRun
    );

    allResults.push(...results);

    // 批次间隔（如果不是最后一批且不是预览模式）
    if (i < batches.length - 1 && !opts.dryRun) {
      console.log(`\n[等待] ${opts.interval}ms 后开始下一批...`);
      await sleep(opts.interval);
    }
  }

  // 6. 汇总报告
  console.log('\n' + '='.repeat(60));
  console.log('更新完成报告');
  console.log('='.repeat(60));

  const successCount = allResults.filter(r => r.success).length;
  const failCount = allResults.length - successCount;

  console.log(`总计: ${allResults.length}`);
  console.log(`成功触发: ${successCount}`);
  console.log(`失败: ${failCount}`);

  if (failCount > 0) {
    console.log('\n失败的 workspace:');
    allResults.filter(r => !r.success).forEach(r => {
      console.log(`  - ${r.name}: ${r.error || '未知错误'}`);
    });
  }

  console.log('='.repeat(60));

  // 退出码
  process.exit(failCount > 0 ? 1 : 0);
}

// 运行
main().catch(error => {
  console.error('\n[错误]', error.message);
  process.exit(1);
});