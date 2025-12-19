/* =========================
   Nav 搜索 — 完整实现（安全高亮 + 响应式展开 + 清除按钮优化）
   说明：
   - 高亮只修改文本节点（TreeWalker），避免破坏 href 等属性
   - 清除按钮合并到输入框内，无内容时隐藏
   - 提供 window.applySearchHighlightFromRender() 供渲染后调用
   ========================= */

/* 配置：根据你页面中卡片容器的选择器调整 */
const RESOURCE_CONTAINER_SELECTOR = ".resources-container, .resources-list, #resources, .resources";

(function () {
  // ---- 工具函数 ----
  function escapeRegex(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  // 清除我们插入的 <mark class="search-highlight">（在 container 内）
  function removeSearchHighlights(container) {
    if (!container) return;
    const marks = container.querySelectorAll("mark.search-highlight");
    marks.forEach((mark) => {
      const parent = mark.parentNode;
      if (!parent) return;
      parent.replaceChild(document.createTextNode(mark.textContent), mark);
      parent.normalize(); // 合并相邻文本节点，保持 DOM 干净
    });
  }

  // 对单个元素安全高亮（只操作文本节点）
  function highlightHtmlElement(el, query) {
    if (!el) return;
    const q = (query || "").trim();
    // 先移除旧高亮
    removeSearchHighlights(el);
    if (!q) return;

    let regex;
    try {
      regex = new RegExp(escapeRegex(q), "ig");
    } catch (e) {
      console.warn("search highlight: invalid regex for query", q);
      return;
    }

    const walker = document.createTreeWalker(
      el,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode(node) {
          if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        },
      },
      false
    );

    // 收集要处理的文本节点（先收集是为了避免在遍历时改动 DOM 导致 walker 行为异常）
    const textNodes = [];
    while (walker.nextNode()) textNodes.push(walker.currentNode);

    textNodes.forEach((textNode) => {
      const parent = textNode.parentNode;
      if (!parent) return;
      const text = textNode.nodeValue;
      if (!regex.test(text)) {
        regex.lastIndex = 0;
        return;
      }
      regex.lastIndex = 0;

      const frag = document.createDocumentFragment();
      let lastIndex = 0;
      let match;
      while ((match = regex.exec(text)) !== null) {
        const matchStart = match.index;
        const matchText = match[0];
        if (matchStart > lastIndex) {
          frag.appendChild(document.createTextNode(text.slice(lastIndex, matchStart)));
        }
        const mark = document.createElement("mark");
        mark.className = "search-highlight";
        mark.textContent = matchText;
        frag.appendChild(mark);
        lastIndex = matchStart + matchText.length;
        if (regex.lastIndex === matchStart) regex.lastIndex++;
      }
      if (lastIndex < text.length) {
        frag.appendChild(document.createTextNode(text.slice(lastIndex)));
      }
      parent.replaceChild(frag, textNode);
      regex.lastIndex = 0;
    });
  }

  // ---- 搜索应用逻辑 ----
  let currentSearchQuery = "";

  function getAllResourceCards() {
    return Array.from(document.querySelectorAll(".resource-card"));
  }

  // 当 query 为空时清理并显示全部；否则隐藏不匹配并高亮匹配项
  function applySearchHighlight(query) {
    currentSearchQuery = (query || "").trim();
    const qLower = currentSearchQuery.toLowerCase();
    const cards = getAllResourceCards();

    // 如果没有卡片，什么也不做，但保留当前Search以便后续渲染后应用
    if (!cards || cards.length === 0) return;

    if (!qLower) {
      // 清除所有高亮并显示所有卡片
      cards.forEach((card) => {
        card.removeAttribute("aria-hidden");
        const title = card.querySelector("h3, .title, .resource-title");
        const desc = card.querySelector(".resource-description, p, .description");
        if (title) removeSearchHighlights(title);
        if (desc) removeSearchHighlights(desc);
      });
      // 恢复分组显示
      document.querySelectorAll(".category-group").forEach((group) => {
        group.style.display = "";
      });
      return;
    }

    // 有 query：逐卡片匹配 title 或 description（包含匹配）
    cards.forEach((card) => {
      const titleEl = card.querySelector("h3, .title, .resource-title");
      const descEl = card.querySelector(".resource-description, p, .description");
      const titleText = titleEl ? titleEl.innerText.toLowerCase() : "";
      const descText = descEl ? descEl.innerText.toLowerCase() : "";

      if (titleText.includes(qLower) || descText.includes(qLower)) {
        // 匹配：显示并高亮
        card.removeAttribute("aria-hidden");
        if (titleEl) highlightHtmlElement(titleEl, currentSearchQuery);
        if (descEl) highlightHtmlElement(descEl, currentSearchQuery);
      } else {
        // 不匹配：隐藏
        card.setAttribute("aria-hidden", "true");
        // 同时清除卡片内可能残留的高亮（避免在再次显示时重复）
        if (titleEl) removeSearchHighlights(titleEl);
        if (descEl) removeSearchHighlights(descEl);
      }
    });

    // 隐藏没有可见卡片的分组
    document.querySelectorAll(".category-group").forEach((group) => {
      const visibleCard = group.querySelector(".resource-card:not([aria-hidden='true'])");
      group.style.display = visibleCard ? "" : "none";
    });
  }

  // ---- UI 交互与事件绑定 ----
  const searchToggleBtn = document.getElementById("search-toggle");
  const searchWrapper = document.getElementById("search-wrapper");
  const searchInput = document.getElementById("nav-search-input");
  const searchClear = document.getElementById("nav-search-clear");
  const navSearchRoot = document.getElementById("nav-search");

  // 保护：如果没有元素则安全退出
  if (!searchToggleBtn || !searchWrapper || !searchInput || !navSearchRoot) {
    window.applySearchHighlightFromRender = function () {
      applySearchHighlight(currentSearchQuery);
    };
    return;
  }

  // 更新清除按钮的显示状态
  function updateClearButtonVisibility() {
    const hasValue = searchInput.value && searchInput.value.trim() !== '';
    if (hasValue) {
      searchClear.style.opacity = '1';
      searchClear.style.pointerEvents = 'all';
    } else {
      searchClear.style.opacity = '0';
      searchClear.style.pointerEvents = 'none';
    }
  }

  // 切换展开状态
  function setSearchOpen(open) {
    if (open) {
      searchWrapper.setAttribute("aria-hidden", "false");
      navSearchRoot.setAttribute("data-search-open", "true");
      searchToggleBtn.classList.add("is-open");
      setTimeout(() => {
        try {
          searchInput.focus();
          const val = searchInput.value;
          searchInput.setSelectionRange && searchInput.setSelectionRange(val.length, val.length);
          // 更新清除按钮状态
          updateClearButtonVisibility();
        } catch (e) {}
      }, 60);
    } else {
      searchWrapper.setAttribute("aria-hidden", "true");
      navSearchRoot.removeAttribute("data-search-open");
      searchToggleBtn.classList.remove("is-open");
    }
  }

  // toggle 点击
  searchToggleBtn.addEventListener("click", (e) => {
    const isOpen = searchWrapper.getAttribute("aria-hidden") === "false";
    if (isOpen) {
      setSearchOpen(false);
    } else {
      setSearchOpen(true);
    }
  });

  // Clear 按钮行为：清空并回到全部显示
  searchClear.addEventListener("click", (e) => {
    searchInput.value = "";
    applySearchHighlight("");
    updateClearButtonVisibility();
    searchInput.focus();
  });

  // 输入防抖
  let debounceTimer = null;
  const DEBOUNCE_MS = 180;
  searchInput.addEventListener("input", (e) => {
    // 更新清除按钮状态
    updateClearButtonVisibility();
    
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      applySearchHighlight(searchInput.value || "");
    }, DEBOUNCE_MS);
  });

  // Esc 关闭或清空
  searchInput.addEventListener("keydown", (ev) => {
    if (ev.key === "Escape") {
      if (searchInput.value) {
        searchInput.value = "";
        applySearchHighlight("");
        updateClearButtonVisibility();
      } else {
        setSearchOpen(false);
      }
    }
    if (ev.key === "Enter") {
      applySearchHighlight(searchInput.value || "");
    }
  });

  // 点击页面空白处在移动端关闭浮层
  document.addEventListener("click", (e) => {
    const isInside = navSearchRoot.contains(e.target);
    const expanded = searchWrapper.getAttribute("aria-hidden") === "false";
    if (expanded && !isInside && window.innerWidth <= 768) {
      setSearchOpen(false);
    }
  });

  // ---- 再渲染与自动恢复 ----
  // 暴露供渲染函数在渲染完成后调用（确保 DOM 完整）
  window.applySearchHighlightFromRender = function () {
    // 在微任务中再次应用，确保最新 DOM 已稳定
    setTimeout(() => {
      applySearchHighlight(currentSearchQuery);
      // 更新清除按钮状态
      updateClearButtonVisibility();
    }, 40);
  };

  // 额外：为了在资源被动态替换时自动重新应用当前搜索状态
  (function setupAutoReapplyObserver() {
    const container = document.querySelector(RESOURCE_CONTAINER_SELECTOR);
    if (!container) return; // 容器不存在则不启用

    const observer = new MutationObserver((mutations) => {
      // 如果有子节点变更或子树替换，重新应用当前搜索（节流）
      let shouldApply = false;
      for (const m of mutations) {
        if (m.type === "childList" && (m.addedNodes.length || m.removedNodes.length)) {
          shouldApply = true;
          break;
        }
        if (m.type === "subtree") {
          shouldApply = true;
          break;
        }
      }
      if (shouldApply) {
        // 小节流
        if (observer._applyTimer) clearTimeout(observer._applyTimer);
        observer._applyTimer = setTimeout(() => {
          applySearchHighlight(currentSearchQuery);
          updateClearButtonVisibility();
        }, 80);
      }
    });

    observer.observe(container, { childList: true, subtree: true });
    // 暴露 observer 以便调试或在不需要时断开
    window.__navSearchObserver = observer;
  })();

  // ---- 初始化 ----
  // 初始化清除按钮状态
  updateClearButtonVisibility();

  // 如果初始输入框有文本（例如用户刷新后保留），立即应用
  if (searchInput.value && searchInput.value.trim()) {
    applySearchHighlight(searchInput.value.trim());
    // 自动展开搜索框以提示用户
    setSearchOpen(true);
    updateClearButtonVisibility();
  }
})();