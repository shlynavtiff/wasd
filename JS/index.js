function scrollToElement(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
    } else {
        console.log('Element not found:', elementId);
    }
}

function navigateTo(path) {
    // Implement navigation functionality
    console.log('Navigating to:', path);
}

function contactDev() {
    const mailtoLink = "mailto:naval.ashleyjames.redacto@gmail.com?subject=Hello&body=Let's work?";
    window.open(mailtoLink, '_blank'); // This opens the email client
    console.log('Contacting developer:', mailtoLink);
}

 // Toggle mobile menu
 const menuToggle = document.getElementById('menu-toggle');
 const mobileMenu = document.getElementById('mobile-menu');

 menuToggle.addEventListener('click', () => {
     mobileMenu.classList.toggle('hidden');
 });


document.addEventListener('DOMContentLoaded', function() {
    const boolRender = true; // Set this based on your condition

    const container = document.createElement('div');
    container.className = 'relative w-full h-full';

    const contentDiv = document.createElement('div');
    contentDiv.className = 'absolute w-full h-full goLow';

    if (boolRender) {
        const img = document.createElement('img');
        img.className = 'w-full h-full object-cover';
        img.src = '//assets/Weird Bubble - Copy@1-1920x957.jpg'; // Adjust the path to your image
        img.alt = 'Weird Bubble';
        contentDiv.appendChild(img);
    } else {
        const spline = document.createElement('iframe');
        spline.src = 'https://prod.spline.design/CJ7b0OdSMJGeC6AB/scene.splinecode';
        spline.className = 'w-full h-full';
        contentDiv.appendChild(spline);
    }

    container.appendChild(contentDiv);
    document.body.appendChild(container);
});