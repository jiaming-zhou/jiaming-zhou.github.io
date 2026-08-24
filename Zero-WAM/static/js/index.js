const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const setupTableOfContents = () => {
    const tocLinks = [...document.querySelectorAll(".toc-link")];
    const sections = tocLinks
        .map((link) => document.querySelector(link.getAttribute("href")))
        .filter(Boolean);

    if (!sections.length) {
        return;
    }

    const setActiveSection = (id) => {
        tocLinks.forEach((link) => {
            const isActive = link.getAttribute("href") === `#${id}`;
            link.classList.toggle("is-active", isActive);
            if (isActive) {
                link.setAttribute("aria-current", "location");
            } else {
                link.removeAttribute("aria-current");
            }
        });
    };

    const observer = new IntersectionObserver(
        (entries) => {
            const visible = entries
                .filter((entry) => entry.isIntersecting)
                .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

            if (visible) {
                setActiveSection(visible.target.id);
            }
        },
        {
            rootMargin: "-28% 0px -58% 0px",
            threshold: [0.05, 0.2, 0.45],
        }
    );

    sections.forEach((section) => observer.observe(section));
};

const pickAndPlacePath = "./static/videos/pick_multiple_0708_ICL_demo_final_compressed_480/";
const sequentialPath = "./static/videos/sequential_manipulation_480/";
const insertionPath = "./static/videos/fine_grained_insertion_480/";

const pairedTask = (label, human, robot, options = {}) => ({
    label,
    human,
    robot,
    description: "",
    tags: [],
    thumbnail: null,
    robotSpeed: null,
    ...options,
});

const demoGroups = {
    pnp: [
        pairedTask(
            "White paper cup to silver plate",
            `${pickAndPlacePath}5-ood-put the white paper cup into silver plate-human.MP4`,
            `${pickAndPlacePath}5-ood-put the white paper cup into silver plate.MP4`
        ),
        pairedTask(
            "Silver coffee cup to white plate",
            `${pickAndPlacePath}6-ood-put the silver coffee up into white plate-human.MP4`,
            `${pickAndPlacePath}6-ood-put the silver coffee up into white plate.MP4`
        ),
        pairedTask(
            "Calabash to brown-green plate",
            `${pickAndPlacePath}7-ood-put the calabash into the brown-green plate-human.MP4`,
            `${pickAndPlacePath}7-ood-put the calabash into the brown-green plate.MP4`
        ),
        pairedTask(
            "Left green pear to white plate",
            `${pickAndPlacePath}8-ood-put the green pear in the left into the white plate-human.MP4`,
            `${pickAndPlacePath}8-ood-put the green pear in the left into the white plate.MP4`
        ),
        pairedTask(
            "Left green pear to brown-green plate",
            `${pickAndPlacePath}9-ood-put the green pear in the left into the brown-green plate-human.MP4`,
            `${pickAndPlacePath}9-ood-put the green pear in the left into the brown-green plate.MP4`
        ),
    ],
    sequential: [
        pairedTask("Silver coffee cup, sponge, and gourd", `${sequentialPath}seq-01-human.mp4`, `${sequentialPath}seq-01-robot.mp4`, {
            description: "Place the silver coffee cup in the wooden basket. Place the sponge in the white tray. Place the gourd on the pink oval plate.",
        }),
        pairedTask("Glue stick, block, and bowl", `${sequentialPath}seq-02-human.mp4`, `${sequentialPath}seq-02-robot.mp4`, {
            description: "Place the glue stick on the brown-green plate. Place the yellow block in the wooden basket. Place the pink bowl in the white tray.",
        }),
        pairedTask("Bread, pear, and cup", `${sequentialPath}seq-03-human.mp4`, `${sequentialPath}seq-03-robot.mp4`, {
            description: "Place the pointed bread in the wooden basket. Place the green pear on the brown-green plate. Place the silver coffee cup in the round paper box.",
        }),
        pairedTask("Cup, pear, and sponge", `${sequentialPath}seq-04-human.mp4`, `${sequentialPath}seq-04-robot.mp4`, {
            description: "Place the wooden cup in the wooden basket. Place the green pear on the brown-green plate. Place the sponge in the white tray.",
        }),
    ],
    insertion: [
        pairedTask("Table leg inserting", `${insertionPath}insert-03-human.mp4`, `${insertionPath}insert-03-robot-2x.mp4?v=20260823-2x`, {
            description: "Move the white tabletop base to the left. Insert the green table leg into the bottom-right corner of the white tabletop, then insert the blue table leg into the top-left corner.",
            tags: ["Long-horizon", "Human-robot collaboration"],
            thumbnail: "./static/images/insertion/table-legs.webp",
            robotSpeed: "Speed ×2",
        }),
        pairedTask("Bulb inserting", `${insertionPath}insert-02-human.mp4`, `${insertionPath}insert-02-robot.mp4`, {
            description: "Insert the black bulb into the black base.",
            thumbnail: "./static/images/insertion/black-bulb.webp",
        }),
        pairedTask("Red column inserting", `${insertionPath}insert-01-human.mp4`, `${insertionPath}insert-01-robot.mp4`, {
            description: "Insert the red column into the black base.",
            thumbnail: "./static/images/insertion/red-column.webp",
        }),
    ],
};

const formatVideoTime = (seconds) => {
    if (!Number.isFinite(seconds) || seconds < 0) {
        return "0:00";
    }

    const totalSeconds = Math.floor(seconds);
    const minutes = Math.floor(totalSeconds / 60);
    const remainingSeconds = String(totalSeconds % 60).padStart(2, "0");
    return `${minutes}:${remainingSeconds}`;
};

const bindVideoProgress = (video) => {
    const shell = video.closest(".video-shell");
    const playToggle = shell.querySelector(".video-play-toggle");
    const progress = shell.querySelector(".video-progress");
    const fill = shell.querySelector(".video-progress-fill");
    const currentTime = shell.querySelector(".video-time-current");
    const durationTime = shell.querySelector(".video-time-duration");
    let isDragging = false;
    let pendingSeekRatio = null;

    const progressFromEvent = (event) => {
        const rect = progress.getBoundingClientRect();
        const x = Math.min(Math.max(event.clientX - rect.left, 0), rect.width);
        return rect.width ? x / rect.width : 0;
    };

    const updateProgress = () => {
        const duration = video.duration;
        const ratio = Number.isFinite(duration) && duration > 0 ? video.currentTime / duration : 0;
        const percent = Math.min(Math.max(ratio * 100, 0), 100);
        fill.style.width = `${percent}%`;
        progress.setAttribute("aria-valuenow", String(Math.round(percent)));
        currentTime.textContent = formatVideoTime(video.currentTime);
        durationTime.textContent = formatVideoTime(duration);
    };

    const updatePlaybackState = () => {
        const isPlaying = !video.paused && !video.ended;
        playToggle.classList.toggle("is-playing", isPlaying);
        playToggle.setAttribute("aria-label", isPlaying ? "Pause video" : "Play video");
    };

    const seekToRatio = (ratio) => {
        const clampedRatio = Math.min(Math.max(ratio, 0), 1);

        if (!Number.isFinite(video.duration) || video.duration <= 0) {
            pendingSeekRatio = clampedRatio;
            return;
        }

        video.currentTime = clampedRatio * video.duration;
        updateProgress();
    };

    progress.addEventListener("pointerdown", (event) => {
        event.preventDefault();
        isDragging = true;
        progress.classList.add("is-dragging");
        progress.setPointerCapture(event.pointerId);
        seekToRatio(progressFromEvent(event));
    });

    progress.addEventListener("pointermove", (event) => {
        if (isDragging) {
            seekToRatio(progressFromEvent(event));
        }
    });

    const finishDrag = (event) => {
        isDragging = false;
        progress.classList.remove("is-dragging");
        if (event && progress.hasPointerCapture(event.pointerId)) {
            progress.releasePointerCapture(event.pointerId);
        }
    };

    progress.addEventListener("pointerup", finishDrag);
    progress.addEventListener("pointercancel", finishDrag);

    progress.addEventListener("keydown", (event) => {
        if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
            return;
        }

        event.preventDefault();
        const step = event.key === "ArrowRight" ? 0.05 : -0.05;
        const duration = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 1;
        seekToRatio((video.currentTime / duration) + step);
    });

    playToggle.addEventListener("click", () => {
        if (video.paused || video.ended) {
            video.play().catch(() => {});
        } else {
            video.pause();
        }
    });

    video.addEventListener("timeupdate", updateProgress);
    video.addEventListener("loadedmetadata", () => {
        if (pendingSeekRatio !== null) {
            const ratio = pendingSeekRatio;
            pendingSeekRatio = null;
            seekToRatio(ratio);
        } else {
            updateProgress();
        }
    });
    video.addEventListener("durationchange", updateProgress);
    video.addEventListener("play", updatePlaybackState);
    video.addEventListener("pause", updatePlaybackState);
    video.addEventListener("ended", updatePlaybackState);
    updatePlaybackState();
};

const setupRobotwinVideoControls = () => {
    document.querySelectorAll(".robotwin-task video").forEach((video) => {
        if (video.closest(".video-shell")) {
            return;
        }

        const shell = document.createElement("div");
        const controls = document.createElement("div");
        const playToggle = document.createElement("button");
        const currentTime = document.createElement("span");
        const progress = document.createElement("div");
        const progressFill = document.createElement("div");
        const durationTime = document.createElement("span");
        const videoLabel = video.getAttribute("aria-label") || "RoboTwin evaluation video";

        shell.className = "video-shell robotwin-video-shell";
        controls.className = "video-controls";
        playToggle.className = "video-play-toggle is-playing";
        playToggle.type = "button";
        playToggle.setAttribute("aria-label", "Pause video");
        currentTime.className = "video-time video-time-current";
        currentTime.textContent = "0:00";
        progress.className = "video-progress";
        progress.setAttribute("role", "slider");
        progress.tabIndex = 0;
        progress.setAttribute("aria-label", `${videoLabel} progress`);
        progress.setAttribute("aria-valuemin", "0");
        progress.setAttribute("aria-valuemax", "100");
        progress.setAttribute("aria-valuenow", "0");
        progressFill.className = "video-progress-fill";
        durationTime.className = "video-time video-time-duration";
        durationTime.textContent = "0:00";

        progress.append(progressFill);
        controls.append(playToggle, currentTime, progress, durationTime);
        video.before(shell);
        shell.append(video, controls);
        bindVideoProgress(video);
    });
};

const renderDemo = (block) => {
    const tasks = demoGroups[block.dataset.demo];
    const taskStrip = block.querySelector(".task-strip");
    const humanVideo = block.querySelector(".human-video");
    const robotVideo = block.querySelector(".robot-video");
    const taskDetail = block.querySelector("[data-task-detail]");
    const activeTaskName = taskDetail?.querySelector(".active-task-name");
    const activeTaskDescription = taskDetail?.querySelector(".active-task-description");
    const activeTaskTags = taskDetail?.querySelector(".active-task-tags");
    const robotSpeedBadge = block.querySelector("[data-video-speed]");
    const scrollLeft = block.querySelector(".task-scroll-left");
    const scrollRight = block.querySelector(".task-scroll-right");
    let activeIndex = 0;

    if (!tasks) {
        return;
    }

    const setActive = (index, options = {}) => {
        activeIndex = (index + tasks.length) % tasks.length;
        const task = tasks[activeIndex];

        buttons.forEach((button, buttonIndex) => {
            const isActive = buttonIndex === activeIndex;
            button.classList.toggle("is-active", isActive);
            button.setAttribute("aria-selected", String(isActive));
            button.tabIndex = isActive ? 0 : -1;
        });

        humanVideo.src = encodeURI(task.human);
        robotVideo.src = encodeURI(task.robot);
        humanVideo.setAttribute("aria-label", `${task.label} human video`);
        robotVideo.setAttribute("aria-label", `${task.label} robot video`);

        if (robotSpeedBadge) {
            robotSpeedBadge.hidden = !task.robotSpeed;
            robotSpeedBadge.textContent = task.robotSpeed || "";
        }

        if (taskDetail) {
            activeTaskName.textContent = task.label;
            activeTaskDescription.textContent = task.description;
            activeTaskTags.replaceChildren(...task.tags.map((tag) => {
                const tagElement = document.createElement("span");
                tagElement.textContent = tag;
                return tagElement;
            }));
        }

        humanVideo.play().catch(() => {});
        robotVideo.play().catch(() => {});

        if (options.scroll !== false) {
            buttons[activeIndex].scrollIntoView({
                behavior: prefersReducedMotion ? "auto" : "smooth",
                inline: "center",
                block: "nearest",
            });
        }
    };

    const buttons = tasks.map((task, index) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "task-button";
        button.setAttribute("role", "tab");
        if (task.thumbnail) {
            button.classList.add("task-button--visual");
            const thumbnail = document.createElement("img");
            const label = document.createElement("span");
            thumbnail.src = task.thumbnail;
            thumbnail.alt = "";
            thumbnail.loading = "lazy";
            thumbnail.width = 320;
            thumbnail.height = 180;
            label.textContent = task.label;
            button.append(thumbnail, label);
        } else {
            button.textContent = task.label;
        }
        button.addEventListener("click", () => setActive(index));
        button.addEventListener("keydown", (event) => {
            if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) {
                event.preventDefault();
                const offset = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : -1;
                setActive(activeIndex + offset);
                buttons[(activeIndex + tasks.length) % tasks.length].focus();
            }
        });
        taskStrip.appendChild(button);
        return button;
    });

    scrollLeft?.addEventListener("click", () => setActive(activeIndex - 1));
    scrollRight?.addEventListener("click", () => setActive(activeIndex + 1));
    [humanVideo, robotVideo].forEach(bindVideoProgress);

    setActive(0, { scroll: false });
};

const setupDataCompositionVideos = () => {
    const composition = document.querySelector("[data-data-composition]");
    if (!composition) {
        return;
    }

    const videos = [...composition.querySelectorAll("[data-composition-video]")];
    let isVisible = false;

    videos.forEach((video) => {
        const offset = Number(video.dataset.offset || 0);
        if (!offset) {
            return;
        }

        video.addEventListener("loadedmetadata", () => {
            if (Number.isFinite(video.duration) && video.duration > 0) {
                video.currentTime = Math.min(offset, Math.max(video.duration - 0.1, 0));
            }
        }, { once: true });
    });

    const setPlayback = (shouldPlay) => {
        videos.forEach((video) => {
            if (!shouldPlay) {
                video.pause();
                return;
            }

            const playback = video.play();
            if (playback) {
                playback.catch(() => {});
            }
        });
    };

    if (prefersReducedMotion) {
        setPlayback(false);
        return;
    }

    const observer = new IntersectionObserver((entries) => {
        isVisible = entries.some((entry) => entry.isIntersecting);
        setPlayback(isVisible && !document.hidden);
    }, { threshold: 0.08 });

    observer.observe(composition);
    document.addEventListener("visibilitychange", () => {
        setPlayback(isVisible && !document.hidden);
    });
};

const setupFrameworkFigureVideos = () => {
    const figure = document.querySelector("[data-framework-figure]");
    if (!figure) {
        return;
    }

    const videos = [...figure.querySelectorAll("[data-framework-video]")];
    let isVisible = false;

    videos.forEach((video) => {
        const revealVideo = () => video.classList.add("is-ready");
        if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
            revealVideo();
        } else {
            video.addEventListener("loadeddata", revealVideo, { once: true });
        }

        const offset = Number(video.dataset.offset || 0);
        const configurePlayback = () => {
            if (offset && Number.isFinite(video.duration) && video.duration > 0) {
                video.currentTime = Math.min(offset, Math.max(video.duration - 0.1, 0));
            }

            const fitDuration = Number(video.dataset.fitDuration || 0);
            if (fitDuration && Number.isFinite(video.duration) && video.duration > fitDuration) {
                const playbackRate = video.duration / fitDuration;
                video.defaultPlaybackRate = playbackRate;
                video.playbackRate = playbackRate;
            }
        };

        if (video.readyState >= HTMLMediaElement.HAVE_METADATA) {
            configurePlayback();
        } else {
            video.addEventListener("loadedmetadata", configurePlayback, { once: true });
        }
    });

    const setPlayback = (shouldPlay) => {
        videos.forEach((video) => {
            if (!shouldPlay) {
                video.pause();
                return;
            }

            const playback = video.play();
            if (playback) {
                playback.catch(() => {});
            }
        });
    };

    if (prefersReducedMotion) {
        setPlayback(false);
        return;
    }

    const observer = new IntersectionObserver((entries) => {
        isVisible = entries.some((entry) => entry.isIntersecting);
        setPlayback(isVisible && !document.hidden);
    }, { rootMargin: "12% 0px", threshold: 0.08 });

    observer.observe(figure);
    document.addEventListener("visibilitychange", () => {
        setPlayback(isVisible && !document.hidden);
    });
};

const setupPipelineAnimation = () => {
    const pipeline = document.querySelector("[data-pipeline]");
    if (!pipeline) {
        return;
    }

    const steps = [...pipeline.querySelectorAll("[data-pipeline-step]")]
        .sort((a, b) => Number(a.dataset.pipelineStep) - Number(b.dataset.pipelineStep));
    const links = [...pipeline.querySelectorAll("[data-pipeline-link]")];
    const videos = [...pipeline.querySelectorAll("[data-pipeline-video]")];
    let activeIndex = 0;
    let timerId = null;
    let isVisible = false;

    const paint = () => {
        steps.forEach((step, index) => step.classList.toggle("is-active", index === activeIndex));
        links.forEach((link) => {
            link.classList.toggle("is-active", Number(link.dataset.pipelineLink) === activeIndex);
        });
    };

    const setVideoPlayback = (shouldPlay) => {
        videos.forEach((video) => {
            if (!shouldPlay) {
                video.pause();
                return;
            }

            const playback = video.play();
            if (playback) {
                playback.catch(() => {});
            }
        });
    };

    const stop = () => {
        window.clearInterval(timerId);
        timerId = null;
        pipeline.classList.remove("is-running");
        pipeline.classList.add("is-paused");
        setVideoPlayback(false);
    };

    const start = () => {
        if (timerId || prefersReducedMotion || !isVisible || document.hidden) {
            return;
        }

        pipeline.classList.add("is-running");
        pipeline.classList.remove("is-paused");
        setVideoPlayback(true);
        paint();
        timerId = window.setInterval(() => {
            activeIndex = (activeIndex + 1) % steps.length;
            paint();
        }, 1100);
    };

    if (prefersReducedMotion) {
        pipeline.classList.add("is-reduced-motion");
        setVideoPlayback(false);
        return;
    }

    const observer = new IntersectionObserver((entries) => {
        isVisible = entries.some((entry) => entry.isIntersecting);
        if (isVisible) {
            start();
        } else {
            stop();
        }
    }, { threshold: 0.15 });

    observer.observe(pipeline);
    document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
            stop();
        } else {
            start();
        }
    });
};

const setupChartAnimation = () => {
    const chart = document.querySelector(".results-chart");
    if (!chart) {
        return;
    }

    if (prefersReducedMotion) {
        chart.classList.add("is-visible");
        return;
    }

    const observer = new IntersectionObserver((entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
            chart.classList.add("is-visible");
            observer.disconnect();
        }
    }, { threshold: 0.25 });

    observer.observe(chart);
};

setupTableOfContents();
document.querySelectorAll(".demo-block").forEach(renderDemo);
setupRobotwinVideoControls();
setupPipelineAnimation();
setupDataCompositionVideos();
setupFrameworkFigureVideos();
setupChartAnimation();
