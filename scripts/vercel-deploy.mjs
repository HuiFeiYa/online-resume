/**
 * Vercel 部署包装器：部署前先确认「连接是否真的能用」，再执行 vercel。
 *
 * 这里解决过两类踩坑，症状都是 `Error: fetch failed`，但根因完全不同：
 *
 * 1) 代理黑洞
 *    用户级环境变量 HTTPS_PROXY 常驻为 http://127.0.0.1:10809（v2rayN）。
 *    v2rayN 没启动时该端口无人监听，CLI 仍强制走这个死代理 -> fetch failed。
 *    -> 本脚本会探测代理存活，死了就剔除代理变量直连。
 *
 * 2) 路径 MTU 黑洞
 *    网卡 MTU 1500，但到 api.vercel.com 的链路 MTU 只有约 1480，且 ICMP
 *    “需要分片”不回传。Windows 的 TCP 默认带 DF 位，于是跨段的请求体被静默丢弃，
 *    重传 5 次（约 31 秒）后报 ECONNRESET -> fetch failed。
 *    特征：GET 等小包正常（所以 `vercel whoami` 能过），一旦上传就挂。
 *    -> 本脚本用一次 8KB POST 做上行探测，失败时直接给出 MTU 修复命令。
 *
 * 用法：
 *   node scripts/vercel-deploy.mjs --prod --yes      # 自动判断（推荐）
 *   node scripts/vercel-deploy.mjs --direct --prod   # 强制直连
 *   node scripts/vercel-deploy.mjs --proxy  --prod   # 强制走代理
 */
import net from 'node:net';
import { spawn, execFileSync } from 'node:child_process';

const PROXY_KEYS = [
  'HTTPS_PROXY',
  'https_proxy',
  'HTTP_PROXY',
  'http_proxy',
  'ALL_PROXY',
  'all_proxy',
];
const HEALTH_URL = 'https://api.vercel.com/ping';
const TIMEOUT_MS = 8000;
const UPLOAD_TIMEOUT_MS = 20000;

// ---------- 解析参数 ----------
let force = 'auto';
const passthrough = [];
for (const arg of process.argv.slice(2)) {
  if (arg === '--direct' || arg === '--no-proxy') force = 'direct';
  else if (arg === '--proxy') force = 'proxy';
  else if (arg === '-h' || arg === '--help') {
    console.log(
      [
        '用法: node scripts/vercel-deploy.mjs [选项] [--] <vercel 参数...>',
        '',
        '选项:',
        '  --direct, --no-proxy  强制直连，忽略环境里的代理',
        '  --proxy               强制使用环境里的代理',
        '  -h, --help            显示帮助',
        '',
        '示例:',
        '  node scripts/vercel-deploy.mjs --prod --yes',
      ].join('\n'),
    );
    process.exit(0);
  } else passthrough.push(arg);
}

// ---------- 工具函数 ----------
function findProxy() {
  for (const key of PROXY_KEYS) {
    const value = process.env[key];
    if (value && value.trim()) return { key, url: value.trim() };
  }
  return null;
}

function parseProxyUrl(raw) {
  try {
    const url = new URL(raw.includes('://') ? raw : `http://${raw}`);
    const port = Number(url.port || (url.protocol === 'https:' ? 443 : 80));
    return { host: url.hostname, port, url: url.toString() };
  } catch {
    return null;
  }
}

function tcpAlive(host, port, timeout = 1500) {
  return new Promise((resolve) => {
    const socket = net.connect({ host, port });
    const finish = (ok) => {
      socket.destroy();
      resolve(ok);
    };
    socket.setTimeout(timeout);
    socket.once('connect', () => finish(true));
    socket.once('timeout', () => finish(false));
    socket.once('error', () => finish(false));
  });
}

function errText(err) {
  return err?.cause?.code || err?.cause?.message || err?.message || String(err);
}

async function probeDirect() {
  try {
    const res = await fetch(HEALTH_URL, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    return { ok: true, detail: `HTTP ${res.status}` };
  } catch (err) {
    return { ok: false, detail: errText(err) };
  }
}

async function probeViaProxy(proxyUrl) {
  try {
    const { ProxyAgent, fetch: proxyFetch } = await import('undici');
    const agent = new ProxyAgent({
      uri: proxyUrl,
      connectTimeout: 3000,
      headersTimeout: TIMEOUT_MS,
      bodyTimeout: TIMEOUT_MS,
    });
    const res = await proxyFetch(HEALTH_URL, {
      dispatcher: agent,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    return { ok: true, detail: `HTTP ${res.status}` };
  } catch (err) {
    return { ok: false, detail: errText(err) };
  }
}

async function probeUpload(proxyUrl) {
  const init = {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: 'x'.repeat(8192),
    signal: AbortSignal.timeout(UPLOAD_TIMEOUT_MS),
  };
  try {
    if (proxyUrl) {
      const { ProxyAgent, fetch: proxyFetch } = await import('undici');
      const agent = new ProxyAgent({ uri: proxyUrl, connectTimeout: 3000 });
      await proxyFetch(HEALTH_URL, { ...init, dispatcher: agent });
    } else {
      await fetch(HEALTH_URL, init);
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, detail: errText(err) };
  }
}

function currentMtu() {
  try {
    if (process.platform !== 'win32') return null;
    const out = execFileSync(
      'powershell',
      [
        '-NoProfile',
        '-Command',
        "Get-NetIPInterface -AddressFamily IPv4 | Where-Object ConnectionState -eq 'Connected' | ForEach-Object { \"$($_.InterfaceIndex):$($_.NlMtu)\" }",
      ],
      { encoding: 'utf8', timeout: 8000 },
    );
    return out.trim().split(/\r?\n/).filter(Boolean).join(' ');
  } catch {
    return null;
  }
}

function printMtuHint(detail) {
  const mtu = currentMtu();
  console.warn('');
  console.warn(`[deploy] ⚠ 上行探测失败（${detail}）：向 api.vercel.com 发不出 8KB 的 POST。`);
  console.warn('[deploy]   部署时 CLI 第一步就是上传几十 KB 的文件清单，因此极可能卡 30 秒后报 fetch failed。');
  console.warn(`[deploy]   最常见原因：路径 MTU 黑洞。当前网卡 MTU -> ${mtu ?? '(读取失败)'}，而到 Vercel 的链路 MTU 约 1480，`);
  console.warn('[deploy]   且 ICMP 不回传，跨段的上行数据被静默丢弃。');
  console.warn('[deploy]   修复（管理员 PowerShell，改完立即生效、重启后保持）：');
  console.warn('[deploy]     Set-NetIPInterface -InterfaceAlias "以太网" -NlMtu 1400');
  console.warn('');
}

function quote(value) {
  return /[\s"]/.test(value) ? `"${value.replace(/"/g, '\\"')}"` : value;
}

// ---------- 决定走代理还是直连 ----------
const proxy = findProxy();
const parsed = proxy ? parseProxyUrl(proxy.url) : null;

console.log(`[deploy] node ${process.version}，代理配置：${proxy ? proxy.url : '（无）'}`);

let useProxy = false;
let reason = '';

if (force === 'proxy') {
  if (!proxy) {
    console.error('✗ 指定了 --proxy，但环境变量里没有 HTTPS_PROXY / HTTP_PROXY / ALL_PROXY。');
    process.exit(2);
  }
  useProxy = true;
  reason = '按参数强制使用代理';
} else if (force === 'direct') {
  useProxy = false;
  reason = '按参数强制直连';
} else if (!proxy) {
  useProxy = false;
  reason = '未配置代理，直连';
} else if (!parsed) {
  useProxy = false;
  reason = `代理地址无法解析（${proxy.url}），直连`;
} else {
  const portOk = await tcpAlive(parsed.host, parsed.port);
  if (!portOk) {
    const direct = await probeDirect();
    if (direct.ok) {
      useProxy = false;
      reason = `代理 ${parsed.host}:${parsed.port} 未监听（v2rayN 未启动？），自动改走直连（${direct.detail}）`;
    } else {
      useProxy = true;
      reason = `代理端口未监听且直连失败（${direct.detail}），仍尝试代理`;
    }
  } else {
    const viaProxy = await probeViaProxy(proxy.url);
    if (viaProxy.ok) {
      useProxy = true;
      reason = `代理可用（${viaProxy.detail}）`;
    } else {
      const direct = await probeDirect();
      if (direct.ok) {
        useProxy = false;
        reason = `代理不通（${viaProxy.detail}），自动改走直连（${direct.detail}）`;
      } else {
        useProxy = false;
        reason = `代理与直连都不通（代理：${viaProxy.detail} / 直连：${direct.detail}），按直连继续`;
      }
    }
  }
}

// ---------- 构造子进程环境 ----------
const env = { ...process.env };
if (useProxy && parsed) {
  env.HTTPS_PROXY = parsed.url;
  env.HTTP_PROXY = parsed.url;
  env.NODE_USE_ENV_PROXY = '1';
} else {
  for (const key of PROXY_KEYS) delete env[key];
  delete env.NODE_USE_ENV_PROXY;
}

console.log(`[deploy] ${useProxy ? '使用代理' : '直连'}：${reason}`);

// ---------- 上行探测 ----------
const upload = await probeUpload(useProxy && parsed ? parsed.url : null);
if (upload.ok) {
  console.log('[deploy] 上行探测通过（8KB POST）');
} else {
  printMtuHint(upload.detail);
}

// ---------- 登录态预检 ----------
function runVercelCapture(args, timeoutMs = 60000) {
  return new Promise((resolve) => {
    const npxCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
    const cmd = [npxCmd, '--yes', 'vercel', ...args].map(quote).join(' ');
    const child = spawn(cmd, { shell: true, stdio: ['ignore', 'pipe', 'pipe'] });
    let output = '';
    const onData = (d) => { output += d.toString(); };
    child.stdout.on('data', onData);
    child.stderr.on('data', onData);
    const timer = setTimeout(() => child.kill('SIGKILL'), timeoutMs);
    child.on('exit', (code) => {
      clearTimeout(timer);
      resolve({ ok: code === 0, output });
    });
    child.on('error', (err) => {
      clearTimeout(timer);
      resolve({ ok: false, output: errText(err) });
    });
  });
}

console.log('[deploy] 登录态预检（vercel whoami）...');
let auth = await runVercelCapture(['whoami']);
if (!auth.ok) {
  console.warn('[deploy] 预检未通过，自动重试一次（token 过期后的静默刷新可能被网络抖动打断）...');
  auth = await runVercelCapture(['whoami']);
}
if (!auth.ok) {
  if (/not authorized/i.test(auth.output)) {
    console.error('✗ Vercel 登录凭证已失效（Not authorized）。');
    console.error('[deploy]   请执行 `npx vercel login` 重新登录，然后再跑 npm run deploy。');
  } else {
    console.error(`✗ 登录态预检未通过：\n${auth.output.trim()}`);
    console.error('[deploy]   若网络正常仍持续失败，请执行 `npx vercel login` 重新登录。');
  }
  process.exit(1);
}

console.log(`[deploy] 开始执行 npx vercel ${passthrough.join(' ')}\n`);

// ---------- 执行 vercel ----------
const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const commandLine = [npx, '--yes', 'vercel', ...passthrough].map(quote).join(' ');

const child = spawn(commandLine, {
  stdio: 'inherit',
  env,
  shell: true,
});

child.on('error', (err) => {
  console.error(`✗ 无法启动 vercel CLI：${err.message}`);
  process.exit(1);
});

child.on('exit', (code, signal) => {
  if (signal) {
    console.error(`✗ vercel 进程被信号 ${signal} 终止`);
    process.exit(1);
  }
  process.exit(code ?? 0);
});
