/**
 * 滚动位置锁定 polyfill
 * 在视频画廊翻页时防止页面滚动跳动
 */

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    initScrollPolyfill();
});

function initScrollPolyfill() {
    // 获取所有翻页按钮
    const galleryButtons = document.querySelectorAll('.gallery-nav-button');
    
    // 为所有翻页按钮添加点击事件
    galleryButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            // 记录当前滚动位置
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            
            // 使用会话存储保存当前滚动位置
            sessionStorage.setItem('lastScrollPos', scrollTop);
            
            // 创建一个绝对定位和尺寸固定的容器来防止布局变化
            lockLayoutChanges();
            
            // 添加一个滚动锁定
            preventScrollChange();
            
            // 确保滚动位置稍后恢复
            setTimeout(function() {
                restoreScrollPosition();
            }, 50);
        });
    });
}

// 锁定布局变化
function lockLayoutChanges() {
    const galleries = document.querySelectorAll('.custom-video-gallery');
    
    galleries.forEach(gallery => {
        const rect = gallery.getBoundingClientRect();
        gallery.style.width = rect.width + 'px';
        gallery.style.height = rect.height + 'px';
    });
}

// 添加滚动锁定
function preventScrollChange() {
    // 防止滚动变化的多种方法
    
    // 1. 添加一个临时覆盖层来捕获滚动事件
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.zIndex = '-1';  // 负的z-index使其不挡住内容
    overlay.style.pointerEvents = 'none';  // 允许点击穿透
    overlay.id = 'scroll-lock-overlay';
    
    document.body.appendChild(overlay);
    
    // 2. 动态添加CSS规则
    const style = document.createElement('style');
    style.id = 'scroll-lock-style';
    style.textContent = `
        html, body {
            scroll-behavior: auto !important;
            overflow-anchor: none !important;
        }
    `;
    
    document.head.appendChild(style);
}

// 恢复滚动位置
function restoreScrollPosition() {
    const savedPosition = sessionStorage.getItem('lastScrollPos');
    
    if (savedPosition !== null) {
        // 尝试多种方法恢复滚动位置
        window.scrollTo(0, parseInt(savedPosition));
        
        // 延迟执行多次以确保不被覆盖
        for (let delay of [10, 50, 100, 200, 300]) {
            setTimeout(() => {
                window.scrollTo(0, parseInt(savedPosition));
            }, delay);
        }
    }
    
    // 最终清理
    setTimeout(() => {
        // 移除临时元素
        const overlay = document.getElementById('scroll-lock-overlay');
        const style = document.getElementById('scroll-lock-style');
        
        if (overlay) overlay.remove();
        if (style) style.remove();
        
        // 恢复galleries的尺寸
        const galleries = document.querySelectorAll('.custom-video-gallery');
        galleries.forEach(gallery => {
            gallery.style.width = '';
            gallery.style.height = '';
        });
    }, 500);
}
