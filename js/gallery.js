document.addEventListener("DOMContentLoaded", () => {
    const galleryImages = document.querySelectorAll(".gallery img");
    const lightbox = document.createElement("div");
    lightbox.classList.add("lightbox");
    document.body.appendChild(lightbox);

    const lightboxImage = document.createElement("img");
    lightbox.appendChild(lightboxImage);

    galleryImages.forEach((img) => {
        img.addEventListener("click", () => {
            lightboxImage.src = img.src;
            lightbox.style.display = "flex";
        });
    });

    lightbox.addEventListener("click", () => {
        lightbox.style.display = "none";
    });
});