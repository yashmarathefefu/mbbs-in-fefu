
/**
 * CinematicHostel
 * Handles the reversible frame-by-frame animation and image gallery
 */
export class CinematicHostel {
    constructor() {
        this.container = document.getElementById('hostel-interactive-container');
        this.canvas = document.getElementById('hostel-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.overlay = document.getElementById('hostel-overlay');
        this.loader = document.getElementById('hostel-loader');
        this.prevBtn = document.getElementById('hostel-prev');
        this.nextBtn = document.getElementById('hostel-next');

        this.totalFrames = 108;
        this.images = [];
        this.loadedImages = 0;
        this.isAnimating = false;
        this.isGalleryMode = false;
        this.currentFrame = 1;

        // Gallery State
        // Slide 0 = Video/Last Frame
        // Slide 1...N = Supabase Images
        this.currentSlideIndex = 0;
        this.sliderImages = [
            {
                src: 'https://ibspwomnrilukdcumsix.supabase.co/storage/v1/object/public/fefu-images/hostel/hostel%20room%20%20(3).avif',
                title: 'Premium Comfort'
            },
            {
                src: 'https://ibspwomnrilukdcumsix.supabase.co/storage/v1/object/public/fefu-images/hostel/use%20this%202.avif',
                title: 'Modern Student Living'
            }
        ];

        this.init();
    }

    init() {
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        // Navigation
        this.prevBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.changeSlide(-1);
        });
        this.nextBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.changeSlide(1);
        });

        // Interaction - Start preload when user is near
        this.initObserver();
        // this.initScrollScrub(); // Disabled scroll scrubbing for all devices

        // Mouse/Touch triggers for immediate interaction priority
        this.container.addEventListener('mouseenter', () => this.preloadFrames());
        this.container.addEventListener('touchstart', () => this.preloadFrames(), { passive: true });

        // Global start signal from loader
        let _hostelLoadInit = false;
        window.addEventListener('start-heavy-loading', () => {
            if (_hostelLoadInit) return;
            _hostelLoadInit = true;
            // Priority load the first frame immediately
            this.loadFrame(1).then(img => this.drawFrame(img)).catch(() => { });
        });

        // Event Listeners for main container
        this.container.addEventListener('click', (e) => {
            // Don't trigger if navigation buttons were clicked
            if (e.target.closest('.hostel-nav-btn')) return;

            // On mobile previously scrubbed, now allow clicking
            // if (window.innerWidth < 992) return;

            // If we are in gallery mode but NOT on the video slide (index 0), 
            // ignore clicks on the container so we don't accidentally reverse.
            if (this.isGalleryMode && this.currentSlideIndex !== 0) return;

            this.toggleAnimation();
        });
    }

    /**
     * Mobile-only: Scrub frames based on scroll position
     * using GSAP ScrollTrigger
     */
    initScrollScrub() {
        if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

        // Create a scrub-only trigger for mobile
        ScrollTrigger.create({
            trigger: "#hostels",
            start: "top 20%",
            end: "bottom 80%",
            scrub: 1.2, // Smooth scrubbing
            onUpdate: (self) => {
                if (window.innerWidth >= 992 || this.isGalleryMode) return;

                // Scrub between frame 1 and 108
                const targetFrame = Math.floor(self.progress * (this.totalFrames - 1)) + 1;
                if (targetFrame !== this.currentFrame) {
                    this.currentFrame = targetFrame;
                    this.loadFrame(this.currentFrame)
                        .then(img => this.drawFrame(img))
                        .catch(() => { });

                    // Hide hotspot while scrubbing
                    if (this.overlay) this.overlay.classList.add('hidden');
                }
            },
            onLeave: () => {
                if (window.innerWidth < 992 && !this.isGalleryMode) {
                    this.enterGalleryMode();
                }
            }
        });
    }

    initObserver() {
        if (!this.container) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.preloadFrames();
                    observer.disconnect();
                }
            });
        }, { rootMargin: '200px' });

        observer.observe(this.container);
    }

    resizeCanvas() {
        const rect = this.container.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) {
            if (!this.resizeRetries) this.resizeRetries = 0;
            if (this.resizeRetries < 10) {
                this.resizeRetries++;
                setTimeout(() => this.resizeCanvas(), 100);
            }
            return;
        }

        this.canvas.width = rect.width;
        this.canvas.height = rect.height;

        if (this.isGalleryMode) {
            this.drawSlide(this.currentSlideIndex);
        } else {
            const frameToDraw = this.images[this.currentFrame] ? this.currentFrame : 1;
            this.loadFrame(frameToDraw).then(img => this.drawFrame(img)).catch(() => { });
        }
    }

    getFramePath(index) {
        const paddedIndex = String(index).padStart(3, '0');
        return `hostel-animation/ezgif-frame-${paddedIndex}.jpg`;
    }

    loadFrame(index) {
        return new Promise((resolve, reject) => {
            if (this.images[index]) {
                resolve(this.images[index]);
                return;
            }
            const img = new Image();
            img.onload = () => {
                this.images[index] = img;
                this.loadedImages++;
                resolve(img);
            };
            img.onerror = () => reject();
            img.src = this.getFramePath(index);
        });
    }

    preloadFrames() {
        if (this.preloadStarted) return;
        this.preloadStarted = true;
        console.log('Hostel animation: Starting staggered preload...');

        // Divide frames into manageable batches to maintain network responsiveness
        const total = this.totalFrames;
        const batchSize = 6;
        let index = 1;

        const loadNextBatch = () => {
            if (index > total) return;

            const batch = [];
            for (let i = 0; i < batchSize && index <= total; i++) {
                batch.push(this.loadFrame(index));
                index++;
            }

            Promise.all(batch).then(() => {
                // Short delay between batches to allow other high-priority fetches
                setTimeout(loadNextBatch, 50);
            });
        };

        loadNextBatch();

        // Also preload gallery slides in the background
        this.sliderImages.forEach(s => {
            const img = new Image();
            img.src = s.src;
        });
    }

    async toggleAnimation() {
        if (this.isAnimating) return;

        // If at start, go forward
        // If at end (in gallery mode), go backward
        const direction = (this.currentFrame <= 1) ? 1 : -1;

        if (direction === 1) {
            this.isGalleryMode = false;
            this.container.classList.remove('gallery-mode');
            this.overlay.classList.add('hidden');
        } else {
            this.isGalleryMode = false;
            this.container.classList.remove('gallery-mode');
            this.overlay.classList.add('hidden'); // Also hide hotspot when reversing
        }

        this.loader.classList.add('active');
        const buffer = direction === 1 ? Math.min(this.totalFrames, this.currentFrame + 20) : Math.max(1, this.currentFrame - 20);
        await this.loadFrame(buffer).catch(() => { });
        this.loader.classList.remove('active');

        this.playAnimation(direction);
    }

    playAnimation(direction) {
        this.isAnimating = true;
        let lastTimestamp = 0;
        const fps = 30;
        const interval = 1000 / fps;

        const animate = (timestamp) => {
            if (!this.isAnimating) return;

            const delta = timestamp - lastTimestamp;
            if (delta >= interval) {
                lastTimestamp = timestamp;

                if (direction === 1) {
                    this.currentFrame++;
                } else {
                    this.currentFrame--;
                }

                this.currentFrame = Math.max(1, Math.min(this.totalFrames, this.currentFrame));

                if (this.images[this.currentFrame]) {
                    this.drawFrame(this.images[this.currentFrame]);
                } else {
                    this.loadFrame(this.currentFrame).catch(() => { });
                }

                if ((direction === 1 && this.currentFrame < this.totalFrames) ||
                    (direction === -1 && this.currentFrame > 1)) {
                    requestAnimationFrame(animate);
                } else {
                    this.isAnimating = false;
                    if (this.currentFrame === this.totalFrames) {
                        // Delay hotspot appearance on last frame by 10s
                        if (this.hotspotTimeout) clearTimeout(this.hotspotTimeout);
                        this.hotspotTimeout = setTimeout(() => {
                            if (this.isGalleryMode && this.currentSlideIndex === 0) {
                                this.overlay.classList.remove('hidden');
                            }
                        }, 10000);

                        this.enterGalleryMode();
                    } else if (this.currentFrame === 1) {
                        this.overlay.classList.remove('hidden'); // Show immediately on start
                    }
                }
            } else {
                requestAnimationFrame(animate);
            }
        };
        requestAnimationFrame(animate);
    }

    drawFrame(image) {
        if (!image || !this.canvas.width || !this.canvas.height) return;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const ratio = image.width / image.height;
        const canvasRatio = this.canvas.width / this.canvas.height;
        let drawWidth, drawHeight, offsetX, offsetY;

        if (canvasRatio > ratio) {
            drawWidth = this.canvas.width;
            drawHeight = this.canvas.width / ratio;
            offsetX = 0;
            offsetY = (this.canvas.height - drawHeight) / 2;
        } else {
            drawWidth = this.canvas.height * ratio;
            drawHeight = this.canvas.height;
            offsetX = (this.canvas.width - drawWidth) / 2;
            offsetY = 0;
        }
        this.ctx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
    }

    enterGalleryMode() {
        this.isGalleryMode = true;
        this.currentSlideIndex = 0; // Slide 0 = Video end
        this.container.classList.add('gallery-mode');
    }

    changeSlide(direction) {
        let nextIndex = this.currentSlideIndex + direction;
        const totalSlides = this.sliderImages.length + 1; // +1 for the Video slide

        if (nextIndex < 0) {
            // Reverse back to video animation
            this.toggleAnimation();
            return;
        }

        if (nextIndex >= totalSlides) {
            nextIndex = 0; // Loop to video
        }

        this.currentSlideIndex = nextIndex;
        this.drawSlide(this.currentSlideIndex);
    }

    drawSlide(index) {
        if (index === 0) {
            // State: Video end - delay hotspot
            if (this.hotspotTimeout) clearTimeout(this.hotspotTimeout);
            this.hotspotTimeout = setTimeout(() => {
                if (this.isGalleryMode && this.currentSlideIndex === 0) {
                    this.overlay.classList.remove('hidden');
                }
            }, 10000);

            if (this.images[this.totalFrames]) {
                this.drawFrame(this.images[this.totalFrames]);
            }
            return;
        }

        this.overlay.classList.add('hidden'); // Hide hotspot for images
        const slide = this.sliderImages[index - 1];
        if (!slide) return;

        const img = new Image();
        img.onload = () => {
            this.container.style.opacity = '0';
            setTimeout(() => {
                this.drawFrame(img);
                this.container.style.opacity = '1';
            }, 300);
        };
        img.src = slide.src;
    }

    drawCaption(text) {
        this.ctx.save();
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        this.ctx.fillRect(0, this.canvas.height - 60, this.canvas.width, 60);
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '500 18px Inter, sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(text, this.canvas.width / 2, this.canvas.height - 30);
        this.ctx.restore();
    }
}

// Initialization
const startHostelInteraction = () => {
    try {
        window.hostelCinematic = new CinematicHostel();
    } catch (err) {
        console.error('Hostel Animation Error:', err);
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startHostelInteraction);
} else {
    startHostelInteraction();
}
