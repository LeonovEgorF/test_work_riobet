'use strict'

const loadImageFromData = (imageElement) => {
    if (!imageElement || !imageElement.getAttribute('data-src')) {
        return;
    }
    const imageSrcset = imageElement.getAttribute('data-srcset');
    if (imageSrcset) {
        imageElement.srcset = imageSrcset;
        imageElement.removeAttribute('data-srcset');
    }
    imageElement.src = imageElement.getAttribute('data-src');
    imageElement.removeAttribute('data-src');
};

const getSlideDuration = () => {
    const durationFromCss = getComputedStyle(document.documentElement).getPropertyValue(
        '--slide-duration',
    );
    const result = parseFloat(durationFromCss) ? durationInSeconds * 1000 : 6000
    return result
};
const initSlider = (slider) => {
    const track = slider.querySelector('.wrapper_slider_track');
    const progress = slider.querySelector('.wrapper_slider_progress');

    if (!track || !progress) {
        return;
    }

    const slides = Array.from(track.children);
    const dots = Array.from(progress.children);
    const prevBtn = slider.querySelector('.wrapper_slider_arrow_prev');
    const nextBtn = slider.querySelector('.wrapper_slider_arrow_next');
    const duration = getSlideDuration();
    const deferred = slider.hasAttribute('data-slider-defer');

    let index = 0;
    let ready = !deferred;

    let timer = null;
    let timerStart = 0;
    let timeLeft = duration;

    let touchX = null;

    const loadCurrentAndNextImage = (slideIndex) => {
        const currentImg = slides[slideIndex].querySelector('img[data-src]');
        loadImageFromData(currentImg);

        const nextIndex = slideIndex + 1 >= slides.length ? 0 : slideIndex + 1;

        const nextImg = slides[nextIndex].querySelector('img[data-src]');
        loadImageFromData(nextImg);
    }
    const restartProgressBar = (dot) => {
        const fill = dot.firstElementChild;
        dot.classList.remove('active');

        if (!fill) {
            return;
        }

        fill.style.animation = 'none';
        fill.offsetWidth;
        fill.style.animation = '';
    }
    const renderCurrentSlide = () => {
        track.style.transform = 'translateX(' + -index * 100 + '%)';

        if (ready) {
            loadCurrentAndNextImage(index);
        }

        dots.forEach(restartProgressBar);
        dots[index].classList.add('active');
    };
    const stopAutoSlide = () => {
        clearTimeout(timer);
        timer = null;
    };
    const startAutoSlide = () => {
        if (slides.length < 2) {
            return;
        }

        if (slider.classList.contains('paused')) {
            return;
        }

        stopAutoSlide();
        timerStart = Date.now();

        timer = setTimeout(() => {
            goToSlide(index + 1);
        }, timeLeft);
    };
    const setSliderPaused = (paused) => {
        const alreadyPaused = slider.classList.contains('paused');

        if (paused === alreadyPaused) {
            return;
        }

        if (paused) {
            if (timer) {
                const elapsed = Date.now() - timerStart;

                timeLeft = timeLeft - elapsed;
                timeLeft = timeLeft < 0 ? 0 : timeLeft;
            }

            slider.classList.add('paused');
            stopAutoSlide();
        } else {
            slider.classList.remove('paused');
            startAutoSlide();
        }
    }
    const goToSlide = (to) => {
        if (to >= slides.length) {
            index = 0;
        } else if (to < 0) {
            index = slides.length - 1;
        } else {
            index = to;
        }

        timeLeft = duration;
        renderCurrentSlide();
        startAutoSlide();
    };
    if (deferred) {
        const slideObserver = new IntersectionObserver(
            (entries) => {
                for (let i = 0; i < entries.length; i++) {
                    if (!entries[i].isIntersecting) {
                        continue;
                    }

                    ready = true;
                    loadCurrentAndNextImage(index);
                    slideObserver.disconnect();
                    return;
                }
            },
            {rootMargin: '400px 0px'},
        );

        slideObserver.observe(slider);
    }
    const handleProgressClick = (event) => {
        const dot = event.target.closest('.wrapper_slider_seg');

        if (!dot) {
            return;
        }

        goToSlide(dots.indexOf(dot));
    };
    const handlePreviousClick = () => {
        goToSlide(index - 1);
    };
    const handleNextClick = () => {
        goToSlide(index + 1);
    };
    const handleMouseEnter = () => {
        setSliderPaused(true);
    };
    const handleMouseLeave = () => {
        setSliderPaused(false);
    };
    const handleVisibilityChange = () => {
        setSliderPaused(document.hidden);
    };
    const handleTouchStart = (event) => {
        touchX = event.touches[0].clientX;
    };
    const handleTouchEnd = (event) => {
        if (touchX === null) {
            return;
        }

        const swipe = event.changedTouches[0].clientX - touchX;
        touchX = null;

        if (swipe <= -40) {
            goToSlide(index + 1);
        } else if (swipe >= 40) {
            goToSlide(index - 1);
        }
    }
}
initSliders();