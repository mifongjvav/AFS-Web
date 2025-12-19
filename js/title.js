// 动态标题功能 - 最终修复版
const titleStates = {
    initial: '才没有欢迎您回来呢！',    // 初始标题
    active: 'AFS',     // 活跃状态标题
    hidden: '哎...你怎么跑了'      // 后台状态标题
};

let titleTimeout;
let isPageActive = true;

// 设置标题函数
function setTitle(state) {
    document.title = titleStates[state];
}

// 取消所有待处理的标题变更
function clearAllTitleChanges() {
    if (titleTimeout) {
        clearTimeout(titleTimeout);
        titleTimeout = null;
    }
}

// 初始化标题状态
function initTitleState() {
    clearAllTitleChanges();
    setTitle('initial');
    
    // 只在页面活跃时设置延迟切换
    if (isPageActive) {
        titleTimeout = setTimeout(() => {
            if (isPageActive) {  // 再次检查状态
                setTitle('active');
            }
        }, 2500);
    }
}

// 页面加载时初始化
initTitleState();

// 处理页面失去焦点
function handlePageInactive() {
    isPageActive = false;
    clearAllTitleChanges();
    setTitle('hidden');
}

// 处理页面获得焦点
function handlePageActive() {
    isPageActive = true;
    initTitleState(); // 重新初始化标题状态
}

// 监听页面可见性变化
document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'hidden') {
        handlePageInactive();
    } else {
        handlePageActive();
    }
});

// 监听窗口焦点变化（额外保障）
window.addEventListener('blur', handlePageInactive);
window.addEventListener('focus', handlePageActive);

// 确保页面卸载时清除定时器
window.addEventListener('beforeunload', clearAllTitleChanges);