// --- SINGLE PAGE APP NAVIGATION LOGIC ---
function switchTab(tabId, event) {
    if (event) {
        event.preventDefault(); 
    }

    // 1. Hide all sections
    const sections = document.querySelectorAll('.page-section');
    sections.forEach(sec => {
        sec.classList.remove('active-section');
        sec.classList.add('hidden-section');
    });

    // 2. Show the targeted section
    const targetSection = document.getElementById(tabId);
    if (targetSection) {
        targetSection.classList.remove('hidden-section');
        targetSection.classList.add('active-section');
    }

    // 3. Toggle "Back to Home" button visibility
    const backBtn = document.getElementById('backToHomeBtn');
    if (tabId === 'about') {
        backBtn.style.display = 'none'; // Hide on Home page
    } else {
        backBtn.style.display = 'flex'; // Show on sub-pages
    }

    // 4. Scroll to top automatically
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// --- PROJECT DATA LOGIC & MODALS ---
const modal = document.getElementById('projectModal');
const projectKeys = Object.keys(projectData);
let currentProjectIndex = 0;
let currentImageIndex = 0;

function openProjectModal(projectId) {
    currentProjectIndex = projectKeys.indexOf(projectId);
    renderProjectData();
    modal.classList.add('show');
    document.body.style.overflow = 'hidden'; 
}

function closeProjectModal() {
    modal.classList.remove('show');
    document.body.style.overflow = 'auto';
}

function renderProjectData() {
    const data = projectData[projectKeys[currentProjectIndex]];
    document.getElementById('modalTitle').innerText = data.title;
    
    const statusElement = document.getElementById('modalStatus');
    statusElement.innerText = data.status;
    statusElement.className = 'status-badge ' + data.statusClass; 
    
    document.getElementById('modalDescription').innerText = data.description;
    currentImageIndex = 0; 
    renderModalImage();
}

function prevProject() {
    if (currentProjectIndex > 0) {
        currentProjectIndex--;
    } else {
        currentProjectIndex = projectKeys.length - 1; 
    }
    renderProjectData();
}

function nextProject() {
    if (currentProjectIndex < projectKeys.length - 1) {
        currentProjectIndex++;
    } else {
        currentProjectIndex = 0; 
    }
    renderProjectData();
}

// --- IMAGE CAROUSEL LOGIC ---
function renderModalImage() {
    const data = projectData[projectKeys[currentProjectIndex]];
    const currentImg = data.images[currentImageIndex];
    document.getElementById('modalCarouselImg').src = currentImg.src;
    document.getElementById('modalImageCaption').innerText = currentImg.caption;
}

function prevImage() {
    const data = projectData[projectKeys[currentProjectIndex]];
    if (currentImageIndex > 0) {
        currentImageIndex--;
    } else {
        currentImageIndex = data.images.length - 1; 
    }
    renderModalImage();
}

function nextImage() {
    const data = projectData[projectKeys[currentProjectIndex]];
    if (currentImageIndex < data.images.length - 1) {
        currentImageIndex++;
    } else {
        currentImageIndex = 0; 
    }
    renderModalImage();
}

// --- LIGHTBOX LOGIC ---
function openLightbox(src) {
    document.getElementById('lightboxImg').src = src;
    document.getElementById('lightboxOverlay').style.display = 'flex';
}

function closeLightbox() {
    document.getElementById('lightboxOverlay').style.display = 'none';
}

window.onclick = function(event) {
    const lightbox = document.getElementById('lightboxOverlay');
    if (event.target === lightbox) {
        closeLightbox();
    } else if (event.target === modal) {
        closeProjectModal();
    }
}

// --- HOME PAGE CAROUSELS LOGIC ---
const worksTrack = document.getElementById('worksCarousel');
if(worksTrack) {
    document.getElementById('prevBtn').addEventListener('click', () => {
        const cardWidth = worksTrack.querySelector('.card').offsetWidth;
        const gap = parseFloat(getComputedStyle(worksTrack).gap) || 32; 
        worksTrack.scrollBy({ left: -(cardWidth + gap), behavior: 'smooth' });
    });
    document.getElementById('nextBtn').addEventListener('click', () => {
        const cardWidth = worksTrack.querySelector('.card').offsetWidth;
        const gap = parseFloat(getComputedStyle(worksTrack).gap) || 32; 
        worksTrack.scrollBy({ left: (cardWidth + gap), behavior: 'smooth' });
    });
}

const servicesTrack = document.getElementById('servicesCarousel');
if(servicesTrack) {
    document.getElementById('prevBtnServices').addEventListener('click', () => {
        const cardWidth = servicesTrack.querySelector('.card').offsetWidth;
        const gap = parseFloat(getComputedStyle(servicesTrack).gap) || 32; 
        servicesTrack.scrollBy({ left: -(cardWidth + gap), behavior: 'smooth' });
    });
    document.getElementById('nextBtnServices').addEventListener('click', () => {
        const cardWidth = servicesTrack.querySelector('.card').offsetWidth;
        const gap = parseFloat(getComputedStyle(servicesTrack).gap) || 32; 
        servicesTrack.scrollBy({ left: (cardWidth + gap), behavior: 'smooth' });
    });
}