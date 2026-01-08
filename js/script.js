// 主题切换功能
const body = document.body;
const scrollToResourcesBtn = document.getElementById("scroll-to-resources");
const backToTopNavBtn = document.getElementById("back-to-top-nav");
const colorThemeButtons = document.querySelectorAll(".theme-option");
const themeModeOptions = document.querySelectorAll(".theme-mode-option");
const followSystemOption = document.getElementById("follow-system-theme");
const lightThemeOption = document.getElementById("light-theme");
const darkThemeOption = document.getElementById("dark-theme");

// ====== 配置区 ======
const FETCH_TIMEOUT = 8000; // fetch 超时（毫秒）
// 添加全局变量来跟踪当前显示模式
let currentDisplayMode = "__all__"; // 默认显示全部（混合模式）

// ====== 特殊标签配置（放在前面，确保在使用前已定义） ======
const specialTags = {
  '坟场': { color: '#888888', order: 4, icon: 'fas fa-skull' },
  '制作中': { color: '#FF8C00', order: 3, icon: 'fas fa-tools' },
  '待定': { color: '#FFD700', order: 2, icon: 'fas fa-hourglass-half' },
  '过审': { color: '#3b82f6', order: 1, icon: 'fas fa-check-circle' },
  '上架': { color: '#10B981', order: 0, icon: 'fas fa-store' },
  '用户喜爱': { color: '#EC4899', order: 5, icon: 'fas fa-heart' }
};

// 默认特殊标签
const DEFAULT_SPECIAL_TAG = '制作中';

// 判断是否为特殊标签
function isSpecialTag(tag) {
  return specialTags.hasOwnProperty(tag);
}

// 获取特殊标签的顺序值
function getSpecialTagOrder(tag) {
  return specialTags[tag] ? specialTags[tag].order : 999;
}

// 资源源
const resourceUrls = [
  "https://raw.githubusercontent.com/mifongjvav/AFS/refs/heads/main/AFS.json",
  "https://hub.gitmirror.com/raw.githubusercontent.com/mifongjvav/AFS/refs/heads/main/AFS.json"
];

// 备份函数数据
const backupResources = [
  {
    "title": "LRCLite",
    "icon": "fas fa-file",
    "description": "LRCLite，一个简单的歌词引擎",
    "link": "https://hub.gitmirmirror.com/raw.githubusercontent.com/mifongjvav/AFS/refs/heads/main/LRCLite.txt",
    "linkText": "获取函数",
    "type": "download",
    "class": "工具"
  },
  {
    "title": "星梦KN函数库",
    "icon": "fas fa-file",
    "description": " <p>原作者：旁观者JErS</p><p>包含列表排序、数据统计、几何计算、RSA加/解密、文本工具、颜色转换等76个实用函数。</p><p>部分函数来自其他函数库，在此对原作者进行感谢。</p>",
    "link": "https://kn.codemao.cn/view/?workId=233953447",
    "linkText": "获取函数",
    "type": "jump",
    "class": ["算法", "通用"]
  },
  {
    "title": "插值函数",
    "icon": "fas fa-file",
    "description": " <p>原作者：方圆圆</p><p>整合了6种插值函数，包括线性/n次/三角/弹跳（传参格式请编辑函数查看</p>",
    "link": "https://hub.gitmirror.com/raw.githubusercontent.com/mifongjvav/AFS/refs/heads/main/scc-part1.txt",
    "linkText": "获取函数",
    "type": "copy",
    "class": "数学"
  },
  {
    "title": "血显特效",
    "icon": "fas fa-file",
    "description": " <p>原作者：方圆圆</p><p>在指定位置绘制一个血条</p>",
    "link": "https://hub.gitmirror.com/raw.githubusercontent.com/mifongjvav/AFS/refs/heads/main/scc-part2.txt",
    "linkText": "获取函数",
    "type": "copy",
    "class": "特效"
  },
  {
    "title": "高精度三角函数",
    "icon": "fas fa-file",
    "description": " <p>原作者：方圆圆</p><p>提供18位精度的三角函数。注意，纯画笔和3d作品慎用！</p>",
    "link": "https://hub.gitmirror.com/raw.githubusercontent.com/mifongjvav/AFS/refs/heads/main/scc-part3.txt",
    "linkText": "获取函数",
    "type": "jump",
    "class": "数学"
  }
];

// 初始化与状态变量
let resourceUpdateInterval = null;
let lastResourceUpdateTime = null;
let currentResources = null; // 存储当前函数数据

// ====== 自动添加默认特殊标签功能 ======
/**
 * 为没有特殊标签的资源自动添加默认特殊标签（坟场）
 * @param {Array} resources 资源数组
 * @returns {Array} 处理后的资源数组
 */
function addDefaultSpecialTagToResources(resources) {
  if (!resources || !Array.isArray(resources)) return resources;

  return resources.map(resource => {
    // 深拷贝资源，避免修改原始数据
    const processedResource = { ...resource };

    // 确保class字段是数组
    let classes = [];
    if (Array.isArray(processedResource.class)) {
      classes = [...processedResource.class];
    } else if (typeof processedResource.class === 'string') {
      // 分割字符串，支持中文逗号、英文逗号和空格分隔
      classes = processedResource.class.split(/\s*[，,]\s*|\s+/).filter(Boolean);
    }

    // 检查是否已经包含任何特殊标签
    const hasSpecialTag = classes.some(cls => isSpecialTag(cls));

    // 如果没有特殊标签，添加默认特殊标签"坟场"
    if (!hasSpecialTag && classes.length > 0) {
      // 确保默认标签不在列表中（避免重复）
      if (!classes.includes(DEFAULT_SPECIAL_TAG)) {
        classes.push(DEFAULT_SPECIAL_TAG);
        processedResource.class = classes;
      }
    }

    return processedResource;
  });
}

function initResourceCards() {
  const resourcesContainer = document.getElementById("resources-container");

  if (!resourcesContainer) {
    console.error("找不到函数卡片容器");
    return;
  }

  resourcesContainer.innerHTML = `
    <div style="text-align: center; padding: 3em; grid-column: 1 / -1;">
      <i class="fas fa-spinner fa-spin" style="font-size: 2em; color: var(--primary-color);"></i>
      <p style="margin-top: 1em;">正在加载函数...</p>
    </div>
  `;

  // 检查是否有可用的资源URL
  if (!resourceUrls || resourceUrls.length === 0) {
    console.log("资源URL为空，直接使用备份数据");
    // 使用备份数据，并添加默认特殊标签
    const processedBackupResources = addDefaultSpecialTagToResources(backupResources);
    currentResources = processedBackupResources;
    renderResourceCards(resourcesContainer, processedBackupResources);
    return; // 不再尝试自动更新
  }

  // 尝试从多个URL获取函数
  fetchResources()
    .then((resources) => {
      // 为所有资源自动添加默认特殊标签（坟场）
      const processedResources = addDefaultSpecialTagToResources(resources);
      currentResources = processedResources; // 保存当前函数
      renderResourceCards(resourcesContainer, processedResources);
      startResourceAutoUpdate(); // 开始自动更新
    })
    .catch((error) => {
      console.error("所有函数获取方式都失败了:", error);
      // 使用备份数据，并添加默认特殊标签
      const processedBackupResources = addDefaultSpecialTagToResources(backupResources);
      currentResources = processedBackupResources;
      renderResourceCards(resourcesContainer, processedBackupResources);
    });
}

// 开始/停止/静默更新
function startResourceAutoUpdate() {
  stopResourceAutoUpdate();
  resourceUpdateInterval = setInterval(() => {
    silentUpdateResources();
  }, 10000);
  lastResourceUpdateTime = new Date();
}

function stopResourceAutoUpdate() {
  if (resourceUpdateInterval) {
    clearInterval(resourceUpdateInterval);
    resourceUpdateInterval = null;
  }
}

async function silentUpdateResources() {
  const resourcesContainer = document.getElementById("resources-container");
  if (!resourcesContainer) return;

  // 如果resourceUrls为空，则跳过静默更新
  if (!resourceUrls || resourceUrls.length === 0) {
    console.log("resourceUrls为空，跳过静默更新");
    return;
  }

  try {
    const newResources = await fetchResources();
    // 为新资源自动添加默认特殊标签
    const processedResources = addDefaultSpecialTagToResources(newResources);
    if (!areResourcesEqual(currentResources, processedResources)) {
      currentResources = processedResources;
      renderResourceCards(resourcesContainer, processedResources);
      lastResourceUpdateTime = new Date();
      showUpdateNotification();
    }
  } catch (error) {
    // 静默失败
    console.log("静默更新失败:", error.message);
  }
}

function areResourcesEqual(resources1, resources2) {
  if (!resources1 || !resources2) return false;
  if (resources1.length !== resources2.length) return false;
  const str1 = JSON.stringify(resources1.map((r) => ({ title: r.title, link: r.link, description: r.description })));
  const str2 = JSON.stringify(resources2.map((r) => ({ title: r.title, link: r.link, description: r.description })));
  return str1 === str2;
}

function showUpdateNotification() {
  if (document.querySelector(".update-notification")) return;
  const notification = document.createElement("div");
  notification.className = "update-notification";
  notification.innerHTML = `
        <div style="
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--primary-color);
            color: white;
            padding: 10px 16px;
            border-radius: var(--border-radius);
            box-shadow: var(--shadow);
            z-index: 10000;
            animation: slideInRight 0.3s ease, fadeOut 0.3s ease 2.7s;
            animation-fill-mode: forwards;
        ">
            <i class="fas fa-sync-alt"></i> 函数已更新
        </div>
    `;
  document.body.appendChild(notification);
  setTimeout(() => {
    if (notification.parentNode) notification.parentNode.removeChild(notification);
  }, 3000);
}

// ====== 获取资源 ======
async function fetchResources() {
  let lastError;
  
  // 如果 resourceUrls 不存在或为空，直接抛出错误
  if (!resourceUrls || resourceUrls.length === 0) {
    console.warn("资源URL列表为空，跳过网络请求");
    throw new Error("资源URL列表为空");
  }
  
  const fetchWithTimeoutLocal = (url, timeout = 5000) => {
    return Promise.race([
      fetch(url),
      new Promise((_, reject) => setTimeout(() => reject(new Error("请求超时")), timeout)),
    ]);
  };

  for (const url of resourceUrls) {
    try {
      console.log(`尝试从 ${url} 获取函数...`);
      const response = await fetchWithTimeoutLocal(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const resources = await response.json();
      console.log(`从 ${url} 成功获取函数`);
      return resources;
    } catch (error) {
      console.warn(`从 ${url} 获取函数失败:`, error.message);
      lastError = error;
    }
  }
  throw lastError || new Error("所有函数URL都失败了");
}

/**
 * 渲染所有函数卡片（按分类分组或混合模式）
 */
function renderResourceCards(container, resources) {
  if (!container) return;

  container.innerHTML = "";

  if (!resources || resources.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 3em; grid-column: 1 / -1; color: var(--text-color); opacity: 0.7;">
        <i class="fas fa-exclamation-triangle" style="font-size: 2em; margin-bottom: 0.5em;"></i>
        <p>暂无可用函数</p>
      </div>
    `;
    return;
  }

  // helper：把 class 字段规范为字符串数组
  const ensureArray = (val) => {
    if (!val && val !== "") return [];
    if (Array.isArray(val)) return val;
    if (typeof val === "string") {
      return val.split(/\s*[，,]\s*|\s+/).filter(Boolean);
    }
    return [];
  };

  // 构建 class -> [resources] 映射
  const classMap = {};
  resources.forEach((res) => {
    const classes = ensureArray(res.class);
    if (classes.length === 0) classes.push("通用");
    classes.forEach((cls) => {
      const key = cls || "通用";
      if (!classMap[key]) classMap[key] = [];
      classMap[key].push(res);
    });
  });

  // 生成分类按钮栏（传入所有分类名数组）
  const categories = Object.keys(classMap).sort((a, b) => {
    // 特殊标签按照配置顺序排序
    const aIsSpecial = isSpecialTag(a);
    const bIsSpecial = isSpecialTag(b);

    if (aIsSpecial && bIsSpecial) {
      return getSpecialTagOrder(a) - getSpecialTagOrder(b);
    }

    if (aIsSpecial) return -1;
    if (bIsSpecial) return 1;

    // 普通标签按字母排序
    return a.localeCompare(b);
  });
  renderCategoryBar(categories);

  // 将链接解析为可在 onclick 中调用的 JS
  function makeOnclickForResource(res) {
    const rawLink = res.link || res.url || "";
    const type = res.type || "jump";

    // 普通链接：使用已有的 window.getText 处理（三种 type: jump/copy/download）
    // 若 link 是空，则返回 noop
    if (!rawLink) return "void(0)";
    return `window.getText('${String(rawLink).replace(/'/g, "\\'")}', '${String(type).replace(/'/g, "\\'")}')`;
  }

  // 渲染：两种模式（混合或按分类）
  if (currentDisplayMode === "__all__") {
    // 混合模式：所有资源平铺
    const mixedContainer = document.createElement("div");
    mixedContainer.id = "mixed-resources";
    mixedContainer.className = "mixed-resources";

    resources.forEach((resource) => {
      const card = document.createElement("div");
      card.className = "resource-card mdui-ripple";
      const iconHTML = resource.icon ? `<i class="${resource.icon}" style="${resource.iconStyle || ""}"></i>` : "";
      const onclick = makeOnclickForResource(resource);
      card.innerHTML = `
        <h3>${iconHTML} ${resource.title || "未命名"}</h3>
        <div class="resource-description">${resource.description || ""}</div>
        <div class="resource-tags">${renderTagsHtml(resource.class)}</div>
        <a class="mdui-ripple" href="javascript:void(0)" onclick="${onclick}">
          <i class="fas fa-external-link-alt"></i> ${resource.linkText || "立即访问"}
        </a>
      `;
      mixedContainer.appendChild(card);
    });

    container.appendChild(mixedContainer);
  } else {
    // 分类模式：为每个分类创建 group
    Object.keys(classMap)
      .sort((a, b) => a.localeCompare(b))
      .forEach((cls) => {
        // 如果 currentDisplayMode 是具体某类，且与 cls 不匹配，则跳过
        if (currentDisplayMode !== "__groups__" && currentDisplayMode !== cls && currentDisplayMode !== "__all__") {
          return;
        }

        const group = document.createElement("div");
        const slug = `category-${slugify(cls)}`;
        group.id = slug;
        group.className = "category-group";

        // 标题区（根据是否为通用/无组别做区分）
        const titleIcon = (cls === "通用" || cls === "无组别") ? "fas fa-tag no-group-icon" : "fas fa-folder-open group-icon";
        group.innerHTML = `<div class="category-title" data-category="${cls}"><i class="${titleIcon}"></i> <span>${cls}</span></div>`;

        const list = document.createElement("div");
        list.className = "category-list";

        classMap[cls].forEach((resource) => {
          const card = document.createElement("div");
          card.className = "resource-card mdui-ripple";
          const iconHTML = resource.icon ? `<i class="${resource.icon}" style="${resource.iconStyle || ""}"></i>` : "";
          const onclick = makeOnclickForResource(resource);
          card.innerHTML = `
            <h3>${iconHTML} ${resource.title || "未命名"}</h3>
            <div class="resource-description">${resource.description || ""}</div>
            <div class="resource-tags">${renderTagsHtml(resource.class)}</div>
            <a class="mdui-ripple" href="javascript:void(0)" onclick="${onclick}">
              <i class="fas fa-external-link-alt"></i> ${resource.linkText || "立即访问"}
            </a>
          `;
          list.appendChild(card);
        });

        group.appendChild(list);
        container.appendChild(group);
      });
  }

  // 渲染后（如果全局有搜索高亮恢复函数，则调用它）
  if (typeof window.applySearchHighlightFromRender === "function") {
    // 在下一微任务调用，确保 DOM 已插入
    setTimeout(() => window.applySearchHighlightFromRender(), 30);
  }
}

// 渲染标签的 HTML，区分组别标签、无组别标签和特殊标签
function renderTagsHtml(classField) {
  const classes = Array.isArray(classField)
    ? classField
    : (typeof classField === "string" ? classField.split(/\s*[，,]\s*|\s+/).filter(Boolean) : []);

  if (classes.length === 0) {
    // 无组别的标签
    return '<span class="tag no-group-tag" onclick="filterByCategoryFromTag(event, \'无组别\')">无组别</span>';
  }

  // 分离特殊标签和普通标签
  const specialTagsList = classes.filter(tag => isSpecialTag(tag));
  const normalTagsList = classes.filter(tag => !isSpecialTag(tag));

  // 按特殊标签顺序排序
  specialTagsList.sort((a, b) => getSpecialTagOrder(a) - getSpecialTagOrder(b));

  // 合并标签列表（特殊标签在前）
  const sortedTags = [...specialTagsList, ...normalTagsList];

  return sortedTags.map((c) => {
    if (c === "精选") {
      return `<span class="tag group-default-tag" onclick="filterByCategoryFromTag(event, '${escapeJs(c)}')">${escapeHtml(c)}</span>`;
    }

    // 特殊标签
    if (isSpecialTag(c)) {
      const iconHTML = specialTags[c]?.icon
        ? `<i class="${specialTags[c].icon} tag-icon"></i>`
        : '';
      return `<span class="tag special-tag special-tag-${escapeJs(c)}" data-special-tag="${escapeJs(c)}" onclick="filterByCategoryFromTag(event, '${escapeJs(c)}')">${iconHTML}${escapeHtml(c)}</span>`;
    }

    // 普通标签
    return `<span class="tag" data-tag="${escapeHtml(c)}" onclick="filterByCategoryFromTag(event, '${escapeJs(c)}')">${escapeHtml(c)}</span>`;
  }).join("");
}

function escapeHtml(unsafe) {
  if (!unsafe && unsafe !== 0) return "";
  return String(unsafe)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeJs(s) {
  return String(s).replace(/'/g, "\\'").replace(/"/g, '\\"');
}

// ====== 现有帮助函数（复制/下载/打开） ======
function createAbsoluteUrl(link) {
  try {
    return new URL(link, window.location.href).toString();
  } catch (e) {
    return null;
  }
}

async function fetchWithTimeout(url, options = {}, timeout = FETCH_TIMEOUT) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const resp = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return resp;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

async function copyText(text) {
  if (!navigator.clipboard) {
    alert("当前浏览器不支持剪贴板 API，请手动复制。");
    throw new Error("Clipboard API not supported");
  }
  await navigator.clipboard.writeText(text);
}

function triggerDownloadFromBlob(blob, filename = "download") {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function guessFilenameFromUrl(urlStr) {
  try {
    const u = new URL(urlStr);
    const parts = u.pathname.split("/");
    let name = parts.pop() || parts.pop() || "download";
    if (!name) name = "download";
    return name;
  } catch (e) {
    return "download";
  }
}

/**
 * 主函数：按 JSON 的 type 处理
 * @param {string} link
 * @param {string} type - jump | copy | download
 */
window.getText = async function (link, type) {
  try { if (event && event.preventDefault) event.preventDefault(); } catch (e) { }

  const absUrl = createAbsoluteUrl(link);
  if (!absUrl) {
    console.error("无效链接：", link);
    window.open(link, "_blank");
    return;
  }

  const action = (type || "jump").toLowerCase();

  if (action === "copy") {
    try {
      const resp = await fetchWithTimeout(absUrl, {}, FETCH_TIMEOUT);
      if (!resp.ok) throw new Error("HTTP " + resp.status);
      const txt = await resp.text();
      await copyText(txt);
      alert("内容已复制到剪贴板！");
    } catch (err) {
      console.error("复制失败：", err);
      const open = confirm("复制失败，是否在新标签页打开链接以查看？\n\n错误：" + (err.message || err));
      if (open) window.open(absUrl, "_blank");
    }
    return;
  }

  if (action === "download") {
    try {
      const resp = await fetchWithTimeout(absUrl, {}, FETCH_TIMEOUT);
      if (!resp.ok) throw new Error("HTTP " + resp.status);
      const blob = await resp.blob();
      const filename = guessFilenameFromUrl(absUrl);
      triggerDownloadFromBlob(blob, filename);
    } catch (err) {
      console.error("下载失败：", err);
      const open = confirm("直接下载失败，是否在新标签页打开链接以继续？\n\n错误：" + (err.message || err));
      if (open) window.open(absUrl, "_blank");
    }
    return;
  }

  window.open(absUrl, "_blank");
};

// 主题与 UI 初始化
let systemThemeMediaQuery = null;
function initTheme() {
  const savedThemeMode = localStorage.getItem("themeMode") || "follow-system";
  const savedColorTheme = localStorage.getItem("colorTheme") || "blue";
  body.dataset.colorTheme = savedColorTheme;
  updateActiveColorTheme(savedColorTheme);
  setThemeMode(savedThemeMode);
}

function setThemeMode(mode) {
  themeModeOptions.forEach((option) => option.classList.remove("active"));
  if (mode === "follow-system") {
    followSystemOption.classList.add("active");
    applySystemTheme();
    watchSystemTheme();
  } else if (mode === "light") {
    lightThemeOption.classList.add("active");
    body.dataset.theme = "light";
    stopWatchingSystemTheme();
  } else if (mode === "dark") {
    darkThemeOption.classList.add("active");
    body.dataset.theme = "dark";
    stopWatchingSystemTheme();
  }
  localStorage.setItem("themeMode", mode);
}

function applySystemTheme() {
  const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  body.dataset.theme = systemPrefersDark ? "dark" : "light";
}

function watchSystemTheme() {
  stopWatchingSystemTheme();
  systemThemeMediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  const handleSystemThemeChange = (e) => {
    if (localStorage.getItem("themeMode") === "follow-system") {
      body.dataset.theme = e.matches ? "dark" : "light";
    }
  };
  systemThemeMediaQuery.addEventListener("change", handleSystemThemeChange);
  systemThemeMediaQuery._changeHandler = handleSystemThemeChange;
}

function stopWatchingSystemTheme() {
  if (systemThemeMediaQuery && systemThemeMediaQuery._changeHandler) {
    systemThemeMediaQuery.removeEventListener("change", systemThemeMediaQuery._changeHandler);
    systemThemeMediaQuery._changeHandler = null;
  }
}

function updateActiveColorTheme(theme) {
  colorThemeButtons.forEach((btn) => {
    btn.classList.remove("active");
    if (btn.dataset.colorTheme === theme) {
      btn.classList.add("active");
    }
  });
}

function setColorTheme(theme) {
  body.dataset.colorTheme = theme;
  localStorage.setItem("colorTheme", theme);
  updateActiveColorTheme(theme);
}

function addCopyButtons() {
  document.querySelectorAll("pre").forEach((pre) => {
    if (!pre.querySelector(".copy-btn")) {
      const btn = document.createElement("button");
      btn.className = "copy-btn";
      btn.innerHTML = '<i class="far fa-copy"></i> 复制代码';
      btn.onclick = () => {
        const code = pre.querySelector("code")?.innerText;
        if (code) {
          navigator.clipboard.writeText(code).then(() => {
            const originalHTML = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-check"></i> 已复制!';
            setTimeout(() => {
              btn.innerHTML = originalHTML;
            }, 2000);
          });
        }
      };
      pre.appendChild(btn);
    }
  });
}

function scrollToResources() {
  document.getElementById("resources-section").scrollIntoView({
    behavior: "smooth",
  });
}

// 事件监听器
followSystemOption.addEventListener("click", () => setThemeMode("follow-system"));
lightThemeOption.addEventListener("click", () => setThemeMode("light"));
darkThemeOption.addEventListener("click", () => setThemeMode("dark"));

scrollToResourcesBtn.addEventListener("click", scrollToResources);
backToTopNavBtn.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});

colorThemeButtons.forEach((btn) => {
  btn.addEventListener("click", () => setColorTheme(btn.dataset.colorTheme));
});

// 在init函数中初始化（把资源初始化放在这里）
function init() {
  initTheme();
  initResourceCards();

  // 移除与wiki相关的内容加载
  const contentElement = document.getElementById("markdown-content");
  if (contentElement && markdownContent) {
    contentElement.innerHTML = marked.parse(markdownContent || "");
    addCopyButtons();
  }

  window.addEventListener("beforeunload", () => {
    stopResourceAutoUpdate();
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      stopResourceAutoUpdate();
    } else {
      setTimeout(() => {
        silentUpdateResources();
        startResourceAutoUpdate();
      }, 1000);
    }
  });
}

console.warn("[信息]", "我趣！有啥阔？！？");
console.log("[信息]", "我就知道你打开这个是有点什么小想法。");
console.log("[AFS] 默认特殊标签:", DEFAULT_SPECIAL_TAG);
console.log("[AFS] 可用特殊标签:", Object.keys(specialTags).join(', '));
console.log("[AFS] 提示: 使用 reapplyDefaultTags() 重新应用默认标签");
console.log("[AFS] 提示: 使用 setDefaultTag('标签名') 更改默认标签");
console.log("[AFS] 提示: 使用 getDefaultTag() 查看当前默认标签");

function manualUpdateResources() {
  silentUpdateResources();
}
window.manualUpdateResources = manualUpdateResources;

/* ====== 新实现：按分类筛选显示 ====== */

/* 生成安全的 slug（避免 id 冲突） */
function safeSlugify(text) {
  if (!text && text !== 0) return "";
  const base = String(text).trim().replace(/\s+/g, "-").replace(/[^\w\-]/g, "");
  let h = 0;
  for (let i = 0; i < base.length; i++) h = (h * 31 + base.charCodeAt(i)) | 0;
  const shortHash = Math.abs(h).toString(36).slice(-2);
  return (base || "cat") + "-" + shortHash;
}

/* 保持兼容：slugify 现指向 safeSlugify */
function slugify(text) {
  return safeSlugify(text);
}

/* 高亮分类按钮（根据分类名） */
function highlightCategoryButton(cls) {
  document.querySelectorAll(".category-button").forEach((b) => {
    const bc = b.dataset.cat;

    // 先移除所有按钮的激活状态
    b.classList.remove("active", "default-active");

    // 然后只激活当前选择的按钮
    if (cls === "__all__" && bc === "__all__") {
      b.classList.add("active", "default-active");
    } else if (cls === "__groups__" && bc === "__groups__") {
      b.classList.add("active");
    } else if (bc === cls) {
      b.classList.add("active");
    }
  });
}

/**
 * 显示某个分类组（只显示目标组，隐藏其它组）。
 * 如果 cls 为 "__all__" 则混合显示所有资源，不分组。
 * 如果 cls 为 "__groups__" 则显示所有有组别的分类。
 */
function filterByCategory(cls) {
  const resourcesContainer = document.getElementById("resources-container");

  // 添加过渡效果
  if (resourcesContainer) {
    resourcesContainer.style.opacity = "0.7";
  }

  // 更新当前显示模式
  currentDisplayMode = cls;

  // 重新渲染资源卡片
  renderResourceCards(resourcesContainer, currentResources);

  // 恢复不透明度
  setTimeout(() => {
    if (resourcesContainer) {
      resourcesContainer.style.opacity = "1";
    }
  }, 300);

  // 确保按钮状态正确更新
  highlightCategoryButton(cls);
}

/* 由卡片上的 tag 调用：直接筛选 */
window.filterByCategoryFromTag = function (event, cls) {
  try { event && event.stopPropagation && event.stopPropagation(); } catch (e) { }
  // 高亮按钮并筛选
  highlightCategoryButton(cls);
  filterByCategory(cls);
};

/**
 * 渲染分类导航栏（点击切换为仅显示该组）
 * classList: 字符串数组
 */
function renderCategoryBar(classList) {
  const bar = document.getElementById("category-bar");
  if (!bar) return;
  bar.innerHTML = ''; // 清空

  // 「全部」按钮 - 添加默认激活样式
  const allBtn = document.createElement("button");
  allBtn.className = "category-button default-active active";
  allBtn.innerText = "全部";
  allBtn.dataset.cat = "__all__";
  allBtn.addEventListener('click', () => {
    filterByCategory("__all__");
  });
  bar.appendChild(allBtn);

  // 「组别」按钮 - 显示所有有组别的分类
  const groupBtn = document.createElement("button");
  groupBtn.className = "category-button";
  groupBtn.innerText = "组别";
  groupBtn.dataset.cat = "__groups__";
  groupBtn.addEventListener('click', () => {
    filterByCategory("__groups__");
  });
  bar.appendChild(groupBtn);

  // ====== 添加特殊标签按钮 ======
  // 首先过滤出classList中的特殊标签
  const specialTagsInList = classList.filter(cls => isSpecialTag(cls));

  // 按特殊标签顺序排序
  const sortedSpecialTags = specialTagsInList.sort((a, b) => {
    return getSpecialTagOrder(a) - getSpecialTagOrder(b);
  });

  // 添加排序后的特殊标签按钮
  sortedSpecialTags.forEach((tagName) => {
    const specialBtn = document.createElement("button");
    specialBtn.className = "category-button special-tag-button";
    specialBtn.dataset.cat = tagName;
    specialBtn.dataset.specialTag = tagName;

    // 添加图标
    const iconHTML = specialTags[tagName]?.icon
      ? `<i class="${specialTags[tagName].icon}"></i> `
      : '';

    specialBtn.innerHTML = `${iconHTML}${tagName}`;

    specialBtn.addEventListener('click', () => {
      filterByCategory(tagName);
    });
    bar.appendChild(specialBtn);
  });

  // 普通分类按钮
  classList.forEach((cls) => {
    // 跳过特殊标签和"通用"、"无组别"分类
    if (isSpecialTag(cls) || cls === "通用" || cls === "无组别") return;

    const btn = document.createElement("button");
    btn.className = "category-button";
    btn.innerText = cls;
    btn.dataset.cat = cls;
    btn.addEventListener('click', () => {
      filterByCategory(cls);
    });
    bar.appendChild(btn);
  });

  // 允许横向滚动以防按钮超出宽度
  bar.style.overflowX = 'auto';
  bar.style.webkitOverflowScrolling = 'touch';
}

// ====== 添加全局函数，允许从控制台或外部设置默认标签 ======
/**
 * 手动为所有资源重新应用默认标签（坟场）
 * 可以通过控制台调用：reapplyDefaultTags()
 */
window.reapplyDefaultTags = function () {
  if (currentResources) {
    const processedResources = addDefaultSpecialTagToResources(currentResources);
    currentResources = processedResources;
    const resourcesContainer = document.getElementById("resources-container");
    if (resourcesContainer) {
      renderResourceCards(resourcesContainer, processedResources);
      console.log(`已重新为所有资源应用默认标签"${DEFAULT_SPECIAL_TAG}"`);
      return `已为 ${processedResources.length} 个资源添加"${DEFAULT_SPECIAL_TAG}"标签`;
    }
  } else {
    console.log("当前没有可用的资源数据");
    return "当前没有可用的资源数据";
  }
};

/**
 * 查看当前使用的默认特殊标签
 */
window.getDefaultTag = function () {
  return DEFAULT_SPECIAL_TAG;
};

/**
 * 更改默认特殊标签
 * @param {string} tagName 新的默认标签名称（必须在specialTags中定义）
 */
window.setDefaultTag = function (tagName) {
  if (isSpecialTag(tagName)) {
    // 更新全局默认标签变量
    const oldTag = DEFAULT_SPECIAL_TAG;
    DEFAULT_SPECIAL_TAG = tagName;
    
    // 重新为所有资源应用新标签
    if (currentResources) {
      // 首先移除旧的默认标签（如果存在）
      const resourcesWithoutOldTag = currentResources.map(resource => {
        const processedResource = { ...resource };
        let classes = [];
        
        if (Array.isArray(processedResource.class)) {
          classes = [...processedResource.class];
        } else if (typeof processedResource.class === 'string') {
          classes = processedResource.class.split(/\s*[，,]\s*|\s+/).filter(Boolean);
        }
        
        // 移除旧的默认标签
        const index = classes.indexOf(oldTag);
        if (index > -1) {
          classes.splice(index, 1);
        }
        
        processedResource.class = classes;
        return processedResource;
      });
      
      // 然后应用新的默认标签
      const newResources = addDefaultSpecialTagToResources(resourcesWithoutOldTag);
      currentResources = newResources;
      
      // 重新渲染
      const resourcesContainer = document.getElementById("resources-container");
      if (resourcesContainer) {
        renderResourceCards(resourcesContainer, newResources);
        console.log(`默认标签已从"${oldTag}"更改为"${tagName}"`);
      }
    }
    
    return `默认标签已更改为: ${tagName}`;
  } else {
    return `"${tagName}" 不是有效的特殊标签。有效标签: ${Object.keys(specialTags).join(', ')}`;
  }
};

// 初始化
init();