document.addEventListener("DOMContentLoaded", () => {
    const galleries = document.querySelectorAll(".gallery");
    const lightbox = document.createElement("div");
    lightbox.classList.add("lightbox");
    document.body.appendChild(lightbox);

    const lightboxImage = document.createElement("img");
    lightbox.appendChild(lightboxImage);

    const controls = document.createElement("div");
    controls.classList.add("controls");
    lightbox.appendChild(controls);

    const prevArrow = document.createElement("span");
    prevArrow.classList.add("arrow");
    prevArrow.textContent = "❮";
    controls.appendChild(prevArrow);

    const nextArrow = document.createElement("span");
    nextArrow.classList.add("arrow");
    nextArrow.textContent = "❯";
    controls.appendChild(nextArrow);

    let currentGallery = [];
    let currentIndex = 0;

    galleries.forEach((gallery) => {
        const images = gallery.querySelectorAll("img");
        gallery.addEventListener("click", (e) => {
            if (e.target.tagName === "IMG") {
                currentGallery = Array.from(images);
                currentIndex = currentGallery.indexOf(e.target);
                openLightbox(currentGallery[currentIndex].src);
            }
        });
    });

    const openLightbox = (src) => {
        lightboxImage.src = src;
        lightbox.style.display = "flex";
    };

    const closeLightbox = () => {
        lightbox.style.display = "none";
    };

    const showNextImage = () => {
        currentIndex = (currentIndex + 1) % currentGallery.length;
        lightboxImage.src = currentGallery[currentIndex].src;
    };

    const showPrevImage = () => {
        currentIndex = (currentIndex - 1 + currentGallery.length) % currentGallery.length;
        lightboxImage.src = currentGallery[currentIndex].src;
    };

    nextArrow.addEventListener("click", showNextImage);
    prevArrow.addEventListener("click", showPrevImage);
    lightbox.addEventListener("click", (e) => {
        if (e.target === lightbox || e.target === lightboxImage) {
            closeLightbox();
        }
    });
});