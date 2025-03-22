const hamburger = document.querySelector(".hamburger");
const navLinks = document.querySelector(".nav-links");

// Add console log to verify elements are found
console.log('Hamburger:', hamburger);
console.log('Nav Links:', navLinks);

hamburger.addEventListener("click", () => {
    console.log('Hamburger clicked'); // Add this to verify click event
    hamburger.classList.toggle("active");
    navLinks.classList.toggle("active");
    console.log('Nav Links classes:', navLinks.classList); // Add this to verify class changes
});

// Close menu when clicking on a nav link
document.querySelectorAll(".nav-links a").forEach(link => {
    link.addEventListener("click", () => {
        hamburger.classList.remove("active");
        navLinks.classList.remove("active");
    });
});

// Close menu when clicking outside
document.addEventListener("click", (e) => {
    if (!hamburger.contains(e.target) && !navLinks.contains(e.target)) {
        hamburger.classList.remove("active");
        navLinks.classList.remove("active");
    }
});