// filepath: /Users/markdeia/Downloads/X-ICM_website/static/js/auto-scroll.js
// 视频画廊翻页功能
console.log('Loading video gallery script');

// 每个画廊的当前页索引
const currentPages = {};
// 每个画廊的自动翻页间隔ID
const autoPageIntervals = {};
// 自动翻页间隔时间（毫秒）
const AUTO_PAGE_INTERVAL = 5000; // 5秒翻一页
// 自动翻页是否启用
const AUTO_PAGE_ENABLED = true;
// 每页显示的视频数量
const VIDEOS_PER_PAGE = 3; // 每页显示3个视频（1行3列）
// 页面是否正在滚动
let isScrolling = false;
// 滚动定时器ID
let scrollingTimer;

// 强制等待页面完全加载
window.addEventListener('load', function() {
    console.log('Page fully loaded, starting video gallery functions');
    
    // Give the page enough time to prepare DOM and CSS
    setTimeout(function() {
        console.log('Setting up video galleries...');
        wrapVideosWithTitles(); // Add wrappers and titles for all videos
        setupPagination(); // Set up pagination functions
        setupAutoPageTurning(); // Set up auto page turning
        setupScrollDetection(); // Set up scroll detection
    }, 1000); // Delay 1 second to ensure all elements are ready
});

// 设置滚动检测
function setupScrollDetection() {
    // 记录上一次滚动位置
    let lastScrollTop = window.pageYOffset || document.documentElement.scrollTop;
    let scrollDelta = 0;
    const scrollThreshold = 5; // At least 5px scroll to be considered as valid scrolling
    let touchStartY = 0; // Touch start position
    
    // Listen for touch events, disable pagination during touch scrolling too
    window.addEventListener('touchstart', function(e) {
        touchStartY = e.touches[0].clientY;
    }, { passive: true });
    
    window.addEventListener('touchmove', function(e) {
        const touchCurrentY = e.touches[0].clientY;
        const touchDelta = Math.abs(touchCurrentY - touchStartY);
        
        // If touch movement exceeds threshold, consider it as page scrolling
        if (touchDelta > scrollThreshold) {
            handleScrolling();
        }
    }, { passive: true });
    
    // 定义处理滚动的函数
    function handleScrolling() {
        // 设置滚动状态为true
        isScrolling = true;
        
        // 清除之前的计时器
        clearTimeout(scrollingTimer);
        
        // 禁用所有翻页按钮
        document.querySelectorAll('.gallery-nav-button').forEach(button => {
            button.disabled = true;
            button.classList.add('disabled');
        });
        
        // 暂停所有自动翻页进度条
        document.querySelectorAll('.custom-video-gallery').forEach(gallery => {
            pauseProgressBar(gallery.id);
        });
        
        // 设置计时器，当滚动停止350毫秒后才认为滚动结束
        scrollingTimer = setTimeout(function() {
            isScrolling = false;
            
            // 启用所有翻页按钮
            document.querySelectorAll('.gallery-nav-button').forEach(button => {
                button.disabled = false;
                button.classList.remove('disabled');
            });
            
            // 恢复所有自动翻页
            document.querySelectorAll('.custom-video-gallery').forEach(gallery => {
                resetAutoPageInterval(gallery.id);
            });
            
            console.log('Scrolling ended, gallery pagination resumed');
        }, 350);
    }
    
    window.addEventListener('scroll', function() {
        // 计算滚动距离
        const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop;
        scrollDelta = Math.abs(currentScrollTop - lastScrollTop);
        
        // 只有滚动超过阈值才认为是有效滚动
        if (scrollDelta > scrollThreshold) {
            // 更新上一次滚动位置
            lastScrollTop = currentScrollTop;
            
            // 处理滚动事件
            handleScrolling();
        }
    }, { passive: true }); // 使用passive事件监听器提高性能
}



// 为所有视频添加包装器和标题
function wrapVideosWithTitles() {
    // 处理所有视频画廊
    document.querySelectorAll('.custom-video-gallery').forEach(gallery => {
        // 首先检查画廊中是否有无效元素
        const allChildren = Array.from(gallery.children);
        const invalidElements = allChildren.filter(child => 
            !child.classList.contains('video-wrapper') && 
            !child.classList.contains('custom-gallery-video-item')
        );
        
        // 移除任何无效或破损的元素
        invalidElements.forEach(element => {
            console.warn(`Removing invalid element: `, element);
            gallery.removeChild(element);
        });
        
        // 查找直接的视频子元素（不在wrapper中的视频）
        const unwrappedVideos = Array.from(gallery.querySelectorAll('.custom-gallery-video-item')).filter(
            video => video.parentElement === gallery
        );
        
        console.log(`Found ${unwrappedVideos.length} unwrapped videos in gallery ${gallery.id}`);
        
        unwrappedVideos.forEach(video => {
            try {
                // 创建包装器
                const wrapper = document.createElement('div');
                wrapper.className = 'video-wrapper';
                wrapper.style.display = 'block'; // 确保包装器可见
                
                // 从视频源URL中提取文件名
                const src = video.getAttribute('src');
                if (!src) {
                    console.warn('Found video element without source, skipping');
                    return;
                }
                
                // 提取最后一个/后面的文件名，并移除扩展名
                let filename = src.split('/').pop().split('.')[0];
                
                // 将下划线替换为空格，并美化标题
                let title = filename.replace(/_/g, ' ');
                title = title.split(' ').map(word => 
                    word.charAt(0).toUpperCase() + word.slice(1)
                ).join(' ');
                
                // 创建标题元素
                const titleDiv = document.createElement('div');
                titleDiv.className = 'video-title';
                titleDiv.textContent = title;
                
                // 替换原始视频元素为包装后的结构
                const clonedVideo = video.cloneNode(true);
                clonedVideo.style.display = 'block'; // 确保视频可见
                
                // 添加到包装器
                wrapper.appendChild(clonedVideo);
                wrapper.appendChild(titleDiv);
                
                // 替换原始视频
                if (video.parentNode === gallery) { // 确保视频还在画廊中
                    gallery.replaceChild(wrapper, video);
                }
            } catch (error) {
                console.error('Error wrapping video:', error);
            }
        });
        
        // 最后验证所有视频是否都被正确包装
        const stillUnwrapped = Array.from(gallery.querySelectorAll('.custom-gallery-video-item')).filter(
            video => video.parentElement === gallery
        );
        
        if (stillUnwrapped.length > 0) {
            console.warn(`Gallery ${gallery.id} still has ${stillUnwrapped.length} unwrapped videos`);
        }
    });
}

// 设置翻页功能
function setupPagination() {
    // 初始化所有画廊的页码
    document.querySelectorAll('.custom-video-gallery').forEach(gallery => {
        const galleryId = gallery.id;
        currentPages[galleryId] = 0;
        
        // 计算总页数
        const totalVideos = gallery.children.length;
        const totalPages = Math.ceil(totalVideos / VIDEOS_PER_PAGE);
        
        console.log(`Gallery ${galleryId} has ${totalVideos} videos, divided into ${totalPages} pages`);
        
        // 初始化显示第一页
        showPage(galleryId, 0);
    });
    
    // 添加翻页按钮事件监听器
    document.querySelectorAll('.gallery-nav-button').forEach(button => {
        button.addEventListener('click', function() {
            const galleryId = this.getAttribute('data-gallery');
            const direction = this.classList.contains('gallery-prev') ? -1 : 1;
            
            // 翻页并重置自动翻页计时器
            changePage(galleryId, direction);
            resetAutoPageInterval(galleryId);
        });
    });
}

// 显示指定画廊的指定页
function showPage(galleryId, pageIndex, animate = true) {
    // 如果页面正在滚动，不执行页面切换
    if (isScrolling) {
        console.log('Page is scrolling, temporarily pausing gallery page switching');
        return;
    }
    
    // 立即禁止页面滚动，稍后恢复
    document.body.style.overflow = 'hidden';
    document.body.style.height = '100%';
    
    // 记住当前滚动位置
    const scrollY = window.scrollY || window.pageYOffset;
    
    const gallery = document.getElementById(galleryId);
    if (!gallery) {
        // 如果找不到画廊，恢复页面滚动并返回
        document.body.style.overflow = '';
        document.body.style.height = '';
        return;
    }
    
    // 获取画廊中的所有视频包装器
    const videoWrappers = Array.from(gallery.children);
    const totalVideos = videoWrappers.length;
    
    // 计算总页数
    const totalPages = Math.ceil(totalVideos / VIDEOS_PER_PAGE);
    
    // 确保页码在有效范围内
    if (pageIndex < 0) pageIndex = totalPages - 1;
    if (pageIndex >= totalPages) pageIndex = 0;
    
    // 获取上一页的索引，用于确定动画方向
    const previousPage = currentPages[galleryId] || 0;
    const direction = (pageIndex > previousPage) ? 1 : -1;
    
    // 更新当前页码
    currentPages[galleryId] = pageIndex;
    
    // 计算当前页的视频索引范围
    const startIdx = pageIndex * VIDEOS_PER_PAGE;
    const endIdx = Math.min(startIdx + VIDEOS_PER_PAGE, totalVideos);
    
    // 在进行任何更改前先确保所有视频都存在且可访问
    videoWrappers.forEach((wrapper, index) => {
        // 修复可能存在的异常结构
        if (wrapper && !wrapper.classList.contains('video-wrapper')) {
            console.warn(`Found non-wrapper element in gallery ${galleryId} at position ${index}, skipping`);
        }
    });
    
    // 开始设置显示状态
    if (animate) {
        // 添加翻页动画效果
        animatePageChange(gallery, videoWrappers, startIdx, endIdx, direction);
    } else {
        // 无动画，直接显示/隐藏
        videoWrappers.forEach((wrapper, index) => {
            if (index >= startIdx && index < endIdx) {
                wrapper.style.display = 'block';
                wrapper.style.opacity = '1';
                wrapper.style.transform = 'translateX(0)';
                
                // 确保视频元素也可见
                const video = wrapper.querySelector('.custom-gallery-video-item');
                if (video) {
                    video.style.display = 'block';
                }
            } else {
                wrapper.style.display = 'none';
            }
        });
    }
    
    // 更新页码指示器
    updatePaginationIndicator(galleryId, pageIndex, totalPages);
    
    console.log(`Showing gallery ${galleryId} page ${pageIndex + 1}/${totalPages}`);
    
    // 一系列恢复滚动位置的尝试，确保不会跳动
    const restoreScrollPosition = () => {
        // 立即恢复到原始滚动位置
        window.scrollTo(0, scrollY);
        
        // 恢复页面滚动
        document.body.style.overflow = '';
        document.body.style.height = '';
    };
    
    if (animate) {
        // 在动画过程中以及结束后多次尝试恢复滚动位置
        window.scrollTo(0, scrollY); // 立即尝试
        
        requestAnimationFrame(() => {
            window.scrollTo(0, scrollY);
        });
        
        // 在动画结束的不同时间点尝试恢复滚动位置
        setTimeout(restoreScrollPosition, 10);
        setTimeout(restoreScrollPosition, 50);
        setTimeout(restoreScrollPosition, 300);
        setTimeout(restoreScrollPosition, 600);
    } else {
        // 直接恢复
        restoreScrollPosition();
    }
}

// 添加翻页动画
function animatePageChange(gallery, videos, startIdx, endIdx, direction) {
    const container = gallery.parentElement;
    
    // 记录画廊容器及其父容器尺寸信息
    const galleryRect = gallery.getBoundingClientRect();
    const galleryHeight = galleryRect.height;
    const containerHeight = container.offsetHeight;
    
    // 固定画廊高度和容器高度（适应单行布局）
    gallery.style.minHeight = `${galleryHeight}px`;
    gallery.style.maxHeight = `${galleryHeight}px`;
    container.style.minHeight = `${containerHeight}px`;
    
    // 为动画设置随机的起始延迟，使视频看起来不会整体同时移动
    function getRandomDelay() {
        return Math.floor(Math.random() * 60); // 0-60ms的随机延迟，稍微减少以提高响应性
    }
    
    // 首先重置所有视频的状态，确保DOM是一致的
    videos.forEach((wrapper) => {
        // 确保wrapper存在且是可动画化的元素
        if (!wrapper || typeof wrapper.style === 'undefined') {
            console.error('Found invalid video wrapper element');
            return;
        }
        
        // 确保所有CSS转换属性都设置了初始值
        if (wrapper.style.transition) {
            wrapper.style.transition = 'none';
        }
    });
    
    // 强制浏览器重绘以应用上述重置
    void gallery.offsetWidth;
    
    // 1. 将要离开的视频淡出并向左/右移动
    videos.forEach((wrapper, index) => {
        if (!wrapper || typeof wrapper.style === 'undefined') return;
        
        if (wrapper.style.display !== 'none' && (index < startIdx || index >= endIdx)) {
            // 应用随机延迟效果
            const delay = getRandomDelay();
            
            // 正在显示但即将隐藏的视频，添加淡出动画
            wrapper.style.transition = `opacity 0.4s ease ${delay}ms, transform 0.4s ease ${delay}ms`;
            wrapper.style.opacity = '0';
            wrapper.style.transform = `translateX(${direction * -30}%) scale(0.95)`;
            
            // 动画结束后隐藏元素
            setTimeout(() => {
                wrapper.style.display = 'none';
            }, 450);
        }
    });
    
    // 2. 新页面的视频从右/左侧淡入，添加更平滑的动画效果
    setTimeout(() => {
        // 记录当前滚动位置，防止内部操作导致滚动
        const currentScrollY = window.scrollY;
        
        videos.forEach((wrapper, index) => {
            if (!wrapper || typeof wrapper.style === 'undefined') return;
            
            if (index >= startIdx && index < endIdx) {
                // 应用随机延迟效果，但减少延迟范围提高响应性
                const delay = getRandomDelay();
                
                // 设置初始状态（在右/左侧且透明）
                wrapper.style.display = 'block';
                wrapper.style.opacity = '0';
                wrapper.style.transform = `translateX(${direction * 30}%) scale(0.95)`;
                
                // 强制重绘以确保初始状态应用
                void wrapper.offsetWidth;
                
                // 应用过渡属性并开始动画
                wrapper.style.transition = `opacity 0.4s ease ${delay}ms, transform 0.4s ease ${delay}ms`;
                wrapper.style.opacity = '1';
                wrapper.style.transform = 'translateX(0) scale(1)';
                
                // 确保视频元素可见
                const video = wrapper.querySelector('.custom-gallery-video-item');
                if (video) {
                    video.style.display = 'block';
                }
            }
        });
        
        // 强制保持滚动位置以防DOM变化导致滚动
        window.scrollTo(0, currentScrollY);
        
        // 在所有动画完成后恢复容器设置
        setTimeout(() => {
            // 恢复容器设置
            gallery.style.minHeight = '';
            gallery.style.maxHeight = '';
            container.style.minHeight = '';
            
            // 最后一次强制滚动位置修正
            window.scrollTo(0, currentScrollY);
        }, 600); // 所有动画完成后
    }, 150); // 等待前一页的淡出动画开始后再淡入新页面
}

// 更新页码指示器
function updatePaginationIndicator(galleryId, currentPage, totalPages) {
    // 查找或创建页码指示器
    let paginationIndicator = document.querySelector(`#${galleryId}-pagination`);
    
    if (!paginationIndicator) {
        // 创建页码指示器
        paginationIndicator = document.createElement('div');
        paginationIndicator.id = `${galleryId}-pagination`;
        paginationIndicator.className = 'pagination-indicator';
        
        // 将页码指示器添加到画廊容器后面
        const container = document.getElementById(`${galleryId}-container`).parentNode;
        
        // 查找画廊标题下方的段落（画廊说明）
        const caption = container.querySelector('.custom-gallery-caption');
        if (caption) {
            // 在说明前插入页码指示器
            container.insertBefore(paginationIndicator, caption);
        } else {
            // 如果没有找到说明，添加到容器末尾
            container.appendChild(paginationIndicator);
        }
    }
    
    // 更新页码指示器内容
    paginationIndicator.innerHTML = `<span class="current-page">${currentPage + 1}</span>/<span class="total-pages">${totalPages}</span`;
}

// 切换到前一页或后一页
function changePage(galleryId, direction) {
    // 如果页面正在滚动，不执行翻页操作
    if (isScrolling) {
        console.log('Page is scrolling, pagination temporarily disabled');
        return false;
    }
    
    // 存储当前滚动位置
    const currentScrollY = window.scrollY || window.pageYOffset;

    // 为防止滚动问题，使用一个标记在DOM中记录当前滚动位置
    document.documentElement.setAttribute('data-scroll-y', currentScrollY);
    
    // 检查是否有未封装的视频元素
    checkAndWrapVideos(galleryId);
    
    const currentPage = currentPages[galleryId] || 0;
    showPage(galleryId, currentPage + direction);
    
    // 在changePage完成时强制滚动回原位
    window.scrollTo(0, currentScrollY);
    
    return true; // 翻页操作成功
}

// 检查并包装未包装的视频
function checkAndWrapVideos(galleryId) {
    const gallery = document.getElementById(galleryId);
    if (!gallery) return;
    
    // 查找直接的视频子元素（不在wrapper中的视频）
    const unwrappedVideos = Array.from(gallery.querySelectorAll('.custom-gallery-video-item')).filter(
        video => video.parentElement === gallery
    );
    
    if (unwrappedVideos.length > 0) {
        console.log(`Found ${unwrappedVideos.length} unwrapped videos, wrapping now...`);
        
        unwrappedVideos.forEach(video => {
            // 创建包装器
            const wrapper = document.createElement('div');
            wrapper.className = 'video-wrapper';
            wrapper.style.display = 'block'; // 确保包装器可见
            
            // 从视频源URL中提取文件名
            const src = video.getAttribute('src');
            if (!src) return;
            
            // 提取最后一个/后面的文件名，并移除扩展名
            let filename = src.split('/').pop().split('.')[0];
            
            // 将下划线替换为空格，并美化标题
            let title = filename.replace(/_/g, ' ');
            title = title.split(' ').map(word => 
                word.charAt(0).toUpperCase() + word.slice(1)
            ).join(' ');
            
            // 创建标题元素
            const titleDiv = document.createElement('div');
            titleDiv.className = 'video-title';
            titleDiv.textContent = title;
            
            // 替换原始视频元素为包装后的结构
            const clonedVideo = video.cloneNode(true);
            clonedVideo.style.display = 'block'; // 确保视频可见
            wrapper.appendChild(clonedVideo);
            wrapper.appendChild(titleDiv);
            gallery.replaceChild(wrapper, video);
        });
    }
}

// 设置自动翻页
function setupAutoPageTurning() {
    if (!AUTO_PAGE_ENABLED) return;
    
    // 添加一个视觉指示器，显示自动翻页的进度
    addAutoPageIndicators();
    
    // 为每个画廊设置自动翻页
    document.querySelectorAll('.custom-video-gallery').forEach(gallery => {
        const galleryId = gallery.id;
        
        // 清除可能存在的旧计时器
        if (autoPageIntervals[galleryId]) {
            clearInterval(autoPageIntervals[galleryId]);
        }
        
        // 设置自动翻页计时器并立即启动
        startAutoPageTimer(galleryId);
        
        // 鼠标悬停时暂停自动翻页
        const container = document.getElementById(`${galleryId}-container`);
        if (container) {
            container.addEventListener('mouseenter', () => {
                clearInterval(autoPageIntervals[galleryId]);
                // 暂停进度条动画
                pauseProgressBar(galleryId);
            });
            
            container.addEventListener('mouseleave', () => {
                // 离开时重新启动自动翻页
                resetAutoPageInterval(galleryId);
            });
        }
    });
}

// 为每个画廊添加自动翻页进度指示器
function addAutoPageIndicators() {
    document.querySelectorAll('.custom-video-gallery').forEach(gallery => {
        const galleryId = gallery.id;
        const container = document.getElementById(`${galleryId}-container`);
        
        if (!container) return;
        
        // 创建进度条容器
        const progressContainer = document.createElement('div');
        progressContainer.className = 'auto-page-progress';
        progressContainer.id = `${galleryId}-progress`;
        
        // 创建进度条
        const progressBar = document.createElement('div');
        progressBar.className = 'progress-bar';
        
        // 添加到DOM
        progressContainer.appendChild(progressBar);
        container.parentNode.insertBefore(progressContainer, container.nextSibling);
    });
}

// 更新进度条动画
function updateProgressBar(galleryId) {
    const progressBar = document.querySelector(`#${galleryId}-progress .progress-bar`);
    if (!progressBar) return;
    
    // 重置进度条
    progressBar.style.transition = 'none';
    progressBar.style.width = '0%';
    
    // 强制重绘
    void progressBar.offsetWidth;
    
    // 启动动画
    progressBar.style.transition = `width ${AUTO_PAGE_INTERVAL}ms linear`;
    progressBar.style.width = '100%';
}

// 暂停进度条动画
function pauseProgressBar(galleryId) {
    const progressBar = document.querySelector(`#${galleryId}-progress .progress-bar`);
    if (!progressBar) return;
    
    // 获取当前进度
    const computedStyle = window.getComputedStyle(progressBar);
    const currentWidth = computedStyle.getPropertyValue('width');
    
    // 暂停在当前进度
    progressBar.style.transition = 'none';
    progressBar.style.width = currentWidth;
}

// 开始自动翻页计时器
function startAutoPageTimer(galleryId) {
    // 更新进度条
    updateProgressBar(galleryId);
    
    // 设置翻页计时器
    autoPageIntervals[galleryId] = setInterval(() => {
        // 只有在页面不滚动时才执行自动翻页
        if (!isScrolling) {
            const success = changePage(galleryId, 1); // 向后翻一页
            if (success) {
                updateProgressBar(galleryId); // 重置并启动进度条
            }
        } else {
            console.log('Page is scrolling, pausing auto pagination');
            // Pause progress bar
            pauseProgressBar(galleryId);
        }
    }, AUTO_PAGE_INTERVAL);
}

// 重置自动翻页计时器
function resetAutoPageInterval(galleryId) {
    // 如果页面正在滚动，不重置自动翻页计时器
    if (isScrolling) {
        console.log('Page is scrolling, postponing auto pagination timer reset');
        return;
    }
    
    // 清除旧计时器
    if (autoPageIntervals[galleryId]) {
        clearInterval(autoPageIntervals[galleryId]);
    }
    
    // 启动新计时器
    startAutoPageTimer(galleryId);
}
