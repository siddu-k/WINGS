document.addEventListener('DOMContentLoaded', () => {
     const parallaxContainer = document.getElementById('parallax-container');
     const layers = document.querySelectorAll('.layer');
     const cards = document.querySelectorAll('.glass-card');

     // Config
     const maxTilt = 10; // Maximum tilt angle for the whole container

     // Add initial transform to set up perspective correctly
     parallaxContainer.style.transformStyle = 'preserve-3d';

     // Setup initial layer depths to push them back
     // Parallax removed: all layers are static now
     layers.forEach(layer => {
         layer.style.transform = '';
     });


     // --- JS cursor movement parallax removed as requested ---


});
