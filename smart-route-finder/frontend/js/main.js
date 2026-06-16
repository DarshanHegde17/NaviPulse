// Main JavaScript for Home Page

function searchRoutes() {
    const source = document.getElementById('source').value.trim();
    const destination = document.getElementById('destination').value.trim();
    const travelMode = document.getElementById('travelMode').value;
    
    if (!source || !destination) {
        alert('Please enter both source and destination');
        return;
    }
    
    // Store search params and redirect to dashboard
    sessionStorage.setItem('searchParams', JSON.stringify({
        source,
        destination,
        travelMode
    }));
    
    window.location.href = 'pages/dashboard.html';
}

// Add enter key support
document.addEventListener('DOMContentLoaded', () => {
    const inputs = document.querySelectorAll('.search-input');
    inputs.forEach(input => {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                searchRoutes();
            }
        });
    });
});

// Hero Animation
function initHeroAnimation() {
    const routeLine = document.querySelector('.route-line');
    if (routeLine) {
        routeLine.style.animation = 'drawLine 2s ease-in-out infinite';
    }
}

// Add CSS animation
const style = document.createElement('style');
style.textContent = `
    @keyframes drawLine {
        0% { width: 0; }
        50% { width: 100%; }
        100% { width: 0; }
    }
    
    .route-line {
        position: absolute;
        top: 50%;
        left: 0;
        height: 3px;
        background: linear-gradient(90deg, #6366f1, #8b5cf6);
        width: 0;
    }
    
    .marker {
        position: absolute;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: #6366f1;
        animation: pulse 2s ease-in-out infinite;
    }
    
    .marker-start {
        top: 50%;
        left: 10%;
    }
    
    .marker-end {
        top: 50%;
        right: 10%;
    }
    
    @keyframes pulse {
        0%, 100% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.5); opacity: 0.5; }
    }
`;
document.head.appendChild(style);

// Initialize on load
window.addEventListener('load', initHeroAnimation);
