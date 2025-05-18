window.HELP_IMPROVE_VIDEOJS = false;

var INTERP_BASE = "./static/interpolation/stacked";
var NUM_INTERP_FRAMES = 240;

var interp_images = [];
function preloadInterpolationImages() {
    for (var i = 0; i < NUM_INTERP_FRAMES; i++) {
        var path = INTERP_BASE + '/' + String(i).padStart(6, '0') + '.jpg';
        interp_images[i] = new Image();
        interp_images[i].src = path;
    }
}

function setInterpolationImage(i) {
    var image = interp_images[i];
    image.ondragstart = function () { return false; };
    image.oncontextmenu = function () { return false; };
    $('#interpolation-image-wrapper').empty().append(image);
}

// 主要初始化函数
$(document).ready(function () {
    // 导航栏汉堡菜单点击事件
    $(".navbar-burger").click(function () {
        $(".navbar-burger").toggleClass("is-active");
        $(".navbar-menu").toggleClass("is-active");
    });

    // 初始化插值图像
    preloadInterpolationImages();

    $('#interpolation-slider').on('input', function (event) {
        setInterpolationImage(this.value);
    });
    setInterpolationImage(0);
    $('#interpolation-slider').prop('max', NUM_INTERP_FRAMES - 1);

    bulmaSlider.attach();

    // 添加打字机效果
    const titleElements = document.querySelectorAll('.publication-title');

    if (titleElements && titleElements.length >= 2) {
        const firstTitle = titleElements[0];
        const secondTitle = titleElements[1];

        // 隐藏第二个标题，等待第一个标题完成打字
        secondTitle.style.opacity = '0';

        // 第一个标题动画完成后，添加完成类
        setTimeout(() => {
            firstTitle.classList.add('typing-done');
        }, 2500);

        // 3秒后显示第二个标题（与CSS动画延迟同步）
        setTimeout(() => {
            secondTitle.style.opacity = '1';
        }, 2900);

        // 第二个标题动画完成后，添加完成类
        setTimeout(() => {
            secondTitle.classList.add('typing-done');
        }, 5500);
    }

    // 页面加载完成后初始化其他功能
    $(window).on('load', function() {
        console.log('页面完全加载完成');
        
        // 初始化滚动动画
        initScrollAnimations();
    });
});


// 格式化任务名称
function formatTaskName(name) {
    return name.split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

// 初始化滚动动画
function initScrollAnimations() {
    console.log('初始化滚动动画');
    // 获取所有需要添加进入动画的元素
    const elements = document.querySelectorAll('.section-title-dark, .custom-video-gallery-container, .method-image, .tasks-image');
    
    // 初始化设置
    elements.forEach(el => {
        el.classList.add('fade-in');
    });
    
    // 检查元素是否在视口内的函数
    function checkIfInView() {
        elements.forEach(el => {
            const rect = el.getBoundingClientRect();
            const windowHeight = window.innerHeight;
            
            if (rect.top <= windowHeight * 0.85) { // 元素顶部进入视口的85%位置
                el.classList.add('visible');
            }
        });
    }
    
    // 初始检查 - 页面加载时可见的元素
    checkIfInView();
    
    // 滚动时检查
    window.addEventListener('scroll', checkIfInView);
}
