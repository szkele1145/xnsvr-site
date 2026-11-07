/* ===== 星凝市 MTR 服务器网站交互脚本 ===== */

(function() {
    'use strict';

    // ===== DOM 元素 =====
    const enterPrompt = document.getElementById('enterPrompt');
    const mainContent = document.getElementById('mainContent');
    const bgm = document.getElementById('bgm');
    const musicToggle = document.getElementById('musicToggle');
    const copyIpBtn = document.getElementById('copyIp');
    const serverIpEl = document.getElementById('serverIp');
    const galleryGrid = document.getElementById('galleryGrid');
    const lightbox = document.getElementById('lightbox');
    const lightboxImage = document.getElementById('lightboxImage');
    const lightboxCaption = document.getElementById('lightboxCaption');
    const lightboxClose = document.getElementById('lightboxClose');
    const lightboxPrev = document.getElementById('lightboxPrev');
    const lightboxNext = document.getElementById('lightboxNext');
    const header = document.querySelector('.header');
    const navLinks = document.querySelectorAll('.nav-link');

    // ===== 图片数据 =====
    const galleryImages = [
        { file: '地铁站台.png', title: '地铁站台', desc: '市区核心换乘站' },
        { file: '市政府站客流状态.png', title: '市政府站', desc: '早晚高峰客流监控' },
        { file: '法院.png', title: '法院站', desc: '地标性地下车站' },
        { file: '车头司机位.png', title: '驾驶视角', desc: '列车司机室内景' },
        { file: '高铁站台.png', title: '高铁站台', desc: '城际高速铁路站台' }
    ];

    let currentLightboxIndex = 0;
    let musicStarted = false;

    // ===== 初始化 =====
    function init() {
        initEnterPrompt();
        initMusic();
        initGallery();
        initLightbox();
        initCopyIp();
        initScrollHeader();
        initNavActive();
        initScrollAnimations();
        initParticles();
    }

    // ===== 进站提示：点击任意位置进入 =====
    function initEnterPrompt() {
        function enterSite(e) {
            // 忽略点击在音乐按钮上的事件
            if (e.target.closest('.music-toggle')) return;

            enterPrompt.classList.add('hidden');
            setTimeout(() => {
                enterPrompt.style.display = 'none';
                mainContent.style.display = 'flex';
                // 尝试播放音乐
                tryPlayMusic();
                // 触发入场动画
                triggerEntranceAnimations();
            }, 400);
        }

        // 点击、触摸、回车、空格都能进站
        document.addEventListener('click', enterSite, { once: true });
        document.addEventListener('touchstart', enterSite, { once: true, passive: true });
        document.addEventListener('keydown', function keydownHandler(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                enterSite(e);
                document.removeEventListener('keydown', keydownHandler);
            }
        }, { once: true });
    }

    // ===== 背景音乐 =====
    function initMusic() {
        if (!musicToggle) return;

        musicToggle.addEventListener('click', toggleMusic);

        // 页面可见性变化时暂停/恢复
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && !bgm.paused) {
                bgm.pause();
                musicToggle.classList.remove('playing');
            }
        });
    }

    function tryPlayMusic() {
        if (musicStarted) return;
        const playPromise = bgm.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                musicStarted = true;
                musicToggle.classList.add('playing');
            }).catch(() => {
                // 自动播放被阻止，等待用户交互
                musicToggle.classList.remove('playing');
            });
        }
    }

    function toggleMusic() {
        if (bgm.paused) {
            bgm.play().then(() => {
                musicToggle.classList.add('playing');
            }).catch(() => {
                showToast('浏览器阻止了自动播放');
            });
        } else {
            bgm.pause();
            musicToggle.classList.remove('playing');
        }
    }

    // ===== 图片画廊 =====
    function initGallery() {
        galleryImages.forEach((img, index) => {
            const item = document.createElement('div');
            item.className = 'gallery-item loading';
            item.dataset.index = index;
            item.innerHTML = `
                <img src="assets/images/${encodeURIComponent(img.file)}" alt="${img.title}" loading="lazy">
                <div class="gallery-overlay">
                    <h3>${img.title}</h3>
                    <p>${img.desc}</p>
                </div>
            `;

            const imgEl = item.querySelector('img');
            imgEl.onload = () => item.classList.remove('loading');
            imgEl.onerror = () => {
                item.classList.remove('loading');
                item.style.background = 'var(--bg-card)';
                imgEl.style.display = 'none';
            };

            item.addEventListener('click', () => openLightbox(index));
            galleryGrid.appendChild(item);
        });
    }

    // ===== 灯箱 =====
    function initLightbox() {
        lightboxClose.addEventListener('click', closeLightbox);
        lightboxPrev.addEventListener('click', () => navigateLightbox(-1));
        lightboxNext.addEventListener('click', () => navigateLightbox(1));

        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) closeLightbox();
        });

        document.addEventListener('keydown', (e) => {
            if (!lightbox.classList.contains('open')) return;
            if (e.key === 'Escape') closeLightbox();
            if (e.key === 'ArrowLeft') navigateLightbox(-1);
            if (e.key === 'ArrowRight') navigateLightbox(1);
        });
    }

    function openLightbox(index) {
        currentLightboxIndex = index;
        const img = galleryImages[index];
        lightboxImage.src = `assets/images/${encodeURIComponent(img.file)}`;
        lightboxImage.alt = img.title;
        lightboxCaption.textContent = `${img.title} · ${img.desc}`;
        lightbox.classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
        lightbox.classList.remove('open');
        document.body.style.overflow = '';
        setTimeout(() => {
            lightboxImage.src = '';
        }, 300);
    }

    function navigateLightbox(dir) {
        currentLightboxIndex = (currentLightboxIndex + dir + galleryImages.length) % galleryImages.length;
        openLightbox(currentLightboxIndex);
    }

    // ===== 复制 IP =====
    function initCopyIp() {
        copyIpBtn.addEventListener('click', async () => {
            const ip = serverIpEl.textContent.trim();
            try {
                await navigator.clipboard.writeText(ip);
                showToast('已复制：' + ip);
                copyIpBtn.classList.add('copied');
                copyIpBtn.querySelector('span').textContent = '已复制';
                setTimeout(() => {
                    copyIpBtn.classList.remove('copied');
                    copyIpBtn.querySelector('span').textContent = '复制地址';
                }, 2000);
            } catch (e) {
                showToast('复制失败，请手动复制');
            }
        });
    }

    // ===== 滚动时 Header 变色 =====
    function initScrollHeader() {
        let lastScroll = 0;
        window.addEventListener('scroll', () => {
            const currentScroll = window.scrollY;
            if (currentScroll > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
            lastScroll = currentScroll;
        }, { passive: true });
    }

    // ===== 导航高亮 =====
    function initNavActive() {
        const sections = document.querySelectorAll('section[id]');
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const id = entry.target.getAttribute('id');
                    navLinks.forEach(link => {
                        link.classList.toggle('active', link.getAttribute('href') === '#' + id);
                    });
                }
            });
        }, { rootMargin: '-30% 0px -60% 0px', threshold: 0.1 });

        sections.forEach(section => observer.observe(section));

        // 平滑滚动
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(link.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        });
    }

    // ===== 滚动入场动画 =====
    function initScrollAnimations() {
        const animatedElements = document.querySelectorAll(
            '.section-header, .info-card, .gallery-item, .feature-card, .contact-card'
        );

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry, index) => {
                if (entry.isIntersecting) {
                    setTimeout(() => {
                        entry.target.style.opacity = '1';
                        entry.target.style.transform = 'translateY(0)';
                    }, index * 80);
                    observer.unobserve(entry.target);
                }
            });
        }, { rootMargin: '0px 0px -50px 0px', threshold: 0.1 });

        animatedElements.forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(30px)';
            el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(el);
        });
    }

    function triggerEntranceAnimations() {
        // Hero 区域立即显示
        const heroElements = document.querySelectorAll('.hero-content > *, .hero-visual > *');
        heroElements.forEach((el, i) => {
            setTimeout(() => {
                el.style.opacity = '1';
                el.style.transform = 'translateY(0)';
            }, i * 100);
        });
    }

    // ===== 粒子背景 =====
    function initParticles() {
        const canvas = document.getElementById('particles-canvas');
        const ctx = canvas.getContext('2d');
        let particles = [];
        let animationId = null;
        let lastTime = 0;
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        function resize() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }

        function createParticles() {
            particles = [];
            const count = Math.min(60, Math.floor((canvas.width * canvas.height) / 15000));
            for (let i = 0; i < count; i++) {
                particles.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    vx: (Math.random() - 0.5) * 0.3,
                    vy: (Math.random() - 0.5) * 0.3,
                    r: Math.random() * 1.5 + 0.5,
                    opacity: Math.random() * 0.4 + 0.1,
                    color: Math.random() > 0.5 ? '0,212,170' : '0,153,255'
                });
            }
        }

        function animate(time) {
            if (prefersReducedMotion) return;

            const dt = time - lastTime;
            lastTime = time;

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // 绘制粒子
            particles.forEach(p => {
                p.x += p.vx * dt * 0.06;
                p.y += p.vy * dt * 0.06;

                // 边界反弹
                if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
                if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

                // 绘制
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${p.color},${p.opacity})`;
                ctx.fill();
            });

            // 连线
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < 140) {
                        const opacity = (1 - dist / 140) * 0.15;
                        ctx.beginPath();
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.strokeStyle = `rgba(0,212,170,${opacity})`;
                        ctx.lineWidth = 0.5;
                        ctx.stroke();
                    }
                }
            }

            animationId = requestAnimationFrame(animate);
        }

        function start() {
            resize();
            createParticles();
            if (!prefersReducedMotion) {
                animationId = requestAnimationFrame(animate);
            }
        }

        function stop() {
            if (animationId) {
                cancelAnimationFrame(animationId);
                animationId = null;
            }
        }

        window.addEventListener('resize', () => {
            resize();
            createParticles();
        });

        // 页面隐藏时暂停
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) stop();
            else start();
        });

        start();
    }

    // ===== Toast 提示 =====
    function showToast(message) {
        // 移除已有的
        const existing = document.querySelector('.toast');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.className = 'toast show';
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 2500);
    }

    // ===== 启动 =====
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();