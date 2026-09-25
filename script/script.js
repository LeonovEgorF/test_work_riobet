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


const initGames = () => {
    const grid = document.getElementById('games-grid');

    if (!grid)  {
        return;
    }

    const rest = document.getElementById('games-rest');

    const tiles = Array.from(grid.children);

    if (rest) {
        Array.from(rest.content.children).forEach((tile) => {
            tiles.push(tile);
        });
    }

    const catBtns = Array.from(document.querySelectorAll('.container_cats_btn'));

    const subBtns = Array.from(document.querySelectorAll('.container_cats_sub'));
    const drop = document.querySelector('.container_cats_item_drop');
    const title = document.getElementById('games-title');
    const showGamesByCategory = (cat, activeBtn, label) => {
        tiles.forEach((tile) => {
            const cats = (tile.dataset.cat || '').split(' ');
            const matched = cats.indexOf(cat) !== -1;

            if (matched && tile.parentNode !== grid) {
                grid.appendChild(tile);
            }

            tile.hidden = !matched;
        });

        catBtns.forEach((catBtn) => {
            const isActive = catBtn === activeBtn;
            catBtn.classList.toggle('active', isActive);

            catBtn.setAttribute('aria-selected', isActive ? 'true' : 'false');
        });

        if (title && label) {
            title.textContent = label;
        }
    };

    const setDropdownOpen = (isOpen) => {
        if (!drop) {
            return;
        }

        drop.classList.toggle('open', isOpen);
        const toggle = drop.querySelector('.container_cats_toggle');

        toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    };

    catBtns.forEach((catBtn) => {
        const handleCategoryClick = () => {
            showGamesByCategory(catBtn.dataset.cat, catBtn, catBtn.dataset.title);
        };

        catBtn.addEventListener('click', handleCategoryClick);
    });

    subBtns.forEach((subBtn) => {
        const handleSubcategoryClick = () => {
            const toggle = document.querySelector('.container_cats_toggle');
            showGamesByCategory(
                subBtn.dataset.cat,
                toggle,
                subBtn.dataset.title,
            );
            setDropdownOpen(false);
        };

        subBtn.addEventListener('click', handleSubcategoryClick);
    });

    if (drop) {
        const hover = window.matchMedia('(hover: hover)').matches;
        const toggle = drop.querySelector('.container_cats_toggle');
        const handleDropdownMouseEnter = () => {
            setDropdownOpen(true);
        };

        const handleDropdownMouseLeave = () => {
            setDropdownOpen(false);
        };
        const handleDropdownToggleClick = () => {
            const opened = drop.classList.contains('open');
            setDropdownOpen(!opened);
        };

        if (hover) {
            drop.addEventListener('mouseenter', handleDropdownMouseEnter);
            drop.addEventListener('mouseleave', handleDropdownMouseLeave);
        } else {
            toggle.addEventListener('click', handleDropdownToggleClick);
        }
        const handleDropdownFocusOut = (event) => {
            if (!drop.contains(event.relatedTarget)) {
                console.log('focusout');
                setDropdownOpen(false);
            }
        };
        const handleClickOutside = (event) => {
            if (!drop.contains(event.target)) {
                setDropdownOpen(false);
            }
        };

        const handleEscapeKey = (event) => {
            if (event.key === 'Escape') {
                setDropdownOpen(false);
            }
        };


        drop.addEventListener('focusout', handleDropdownFocusOut);

        document.addEventListener('click', handleClickOutside);
        document.addEventListener('keydown', handleEscapeKey);
    }

    showGamesByCategory('popular', catBtns[0], catBtns[0].dataset.title);
};
const keepFocusInsideModal = (event, modal) => {
    if (event.key !== 'Tab') {
        return;
    }

    const focusable = modal.querySelectorAll('button, a[href]');

    if (!focusable.length) {
        return;
    }

    const firstEl = focusable[0];
    const lastEl = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === firstEl) {
        event.preventDefault();
        lastEl.focus();
    } else if (!event.shiftKey && document.activeElement === lastEl) {
        event.preventDefault();
        firstEl.focus();
    }
};
//let lockCount = 0;
// const lockPageScroll = () => {
//     if (lockCount === 0) {
//         const gap = window.innerWidth - document.documentElement.clientWidth;
//         document.documentElement.style.setProperty('--scroll-lock-gap', `${gap}px`);
//         document.body.classList.add('scroll-lock');
//     }
//
//     lockCount += 1;
// };
// const unlockPageScroll = () => {
//     lockCount = Math.max(0, lockCount - 1);
//
//     if (lockCount === 0) {
//         document.body.classList.remove('scroll-lock');
//         document.documentElement.style.removeProperty('--scroll-lock-gap');
//     }
// };

const initWinners = () => {
    const block = document.getElementById('winners');

    if (!block) {
        return;
    }

    const track = document.getElementById('winners-track');
    const prevBtn = document.getElementById('winners-prev');
    const nextBtn = document.getElementById('winners-next');
    let timer = null;

    const getCardScrollStep = () => {
        const card = track.firstElementChild;

        return card ? card.getBoundingClientRect().width + 7 : 0;
    };
    const getMaxScrollLeft = () => {
        return track.scrollWidth - track.clientWidth;
    };
    const syncWinnerArrows = () => {
        const overflow = getMaxScrollLeft() > 2;
        prevBtn.hidden = !overflow;
        nextBtn.hidden = !overflow;
    };
    const scrollWinnersByCard = (dir) => {
        let left = track.scrollLeft + dir * getCardScrollStep();

        if (dir > 0 && track.scrollLeft >= getMaxScrollLeft() - 2) {
            left = 0;
        } else if (dir < 0 && track.scrollLeft <= 2) {
            left = getMaxScrollLeft();
        }

        track.scrollTo({ left: left, behavior: 'smooth' });
    };
    const startWinnersAutoScroll = () => {
        clearInterval(timer);
        timer = setInterval(() => {
            scrollWinnersByCard(1);
        }, 4000);
    };
    const stopWinnersAutoScroll = () => {
        clearInterval(timer);
        timer = null;
    };

    const handleWinnersPreviousClick = () => {
        scrollWinnersByCard(-1);
        startWinnersAutoScroll();
    };

    const handleWinnersNextClick = () => {
        scrollWinnersByCard(1);
        startWinnersAutoScroll();
    };

    const handleWinnersVisibilityChange = () => {
        document.hidden ? stopWinnersAutoScroll() : startWinnersAutoScroll();
    };

    prevBtn.addEventListener('click', handleWinnersPreviousClick);
    nextBtn.addEventListener('click', handleWinnersNextClick);
    block.addEventListener('mouseenter', stopWinnersAutoScroll);
    block.addEventListener('mouseleave', startWinnersAutoScroll);
    block.addEventListener('focusin', stopWinnersAutoScroll);
    block.addEventListener('focusout', startWinnersAutoScroll);
    track.addEventListener('touchstart', stopWinnersAutoScroll);
    document.addEventListener('visibilitychange', handleWinnersVisibilityChange);
    window.addEventListener('resize', syncWinnerArrows);

    const cardObserver = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {

                if (!entry.isIntersecting) {
                    return;
                }

                const img = entry.target.querySelector('img[data-src]');
                loadImageFromData(img);
                cardObserver.unobserve(entry.target);
            });
        },
        { root: track, rootMargin: '0px 80px' },
    );

    Array.from(track.children).forEach((card) => {
        if (card.querySelector('img[data-src]')) {
            cardObserver.observe(card);
        }
    });

    syncWinnerArrows();
    startWinnersAutoScroll();
};
initSlider();
initGames()
initWinners();