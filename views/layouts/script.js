// Get references to the burger menu, right menu, and overlay
const burgerMenu = document.getElementById('burger-menu');
const rightMenu = document.getElementById('right-menu');
const overlay = document.getElementById('overlay');

// Add an event listener to the burger menu to toggle the right menu and overlay
burgerMenu.addEventListener('click', () => {
    rightMenu.classList.toggle('show');
    overlay.classList.toggle('show');
});
