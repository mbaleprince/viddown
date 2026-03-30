document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('download-form');
    const urlInput = document.getElementById('video-url');
    const loader = document.getElementById('loader');
    const resultContainer = document.getElementById('result-container');
    const fetchBtn = document.getElementById('fetch-btn');

    const platforms = {
        youtube: { regex: /(youtube\.com|youtu\.be)/i, id: 'logo-youtube', color: '#ff0000', name: 'YouTube', icon: 'fa-youtube' },
        tiktok: { regex: /tiktok\.com/i, id: 'logo-tiktok', color: '#00ffff', name: 'TikTok', icon: 'fa-tiktok' }, // used cyan to pop
        facebook: { regex: /fb\.watch|facebook\.com/i, id: 'logo-facebook', color: '#1877f2', name: 'Facebook', icon: 'fa-facebook' },
        instagram: { regex: /instagram\.com/i, id: 'logo-instagram', color: '#e1306c', name: 'Instagram', icon: 'fa-instagram' },
        twitter: { regex: /(twitter\.com|x\.com)/i, id: 'logo-twitter', color: '#1da1f2', name: 'X (Twitter)', icon: 'fa-x-twitter' }
    };

    // Platform Detection
    urlInput.addEventListener('input', (e) => {
        const url = e.target.value;
        
        // Reset colors
        Object.values(platforms).forEach(p => {
            document.getElementById(p.id).style.color = 'var(--light-text)';
            document.getElementById(p.id).style.transform = 'scale(1)';
        });

        // Highlight matched platform
        for (const [key, p] of Object.entries(platforms)) {
            if (p.regex.test(url)) {
                const iconElement = document.getElementById(p.id);
                iconElement.style.color = p.color;
                iconElement.style.transform = 'scale(1.2)';
                break;
            }
        }
    });

    // Form submission via AJAX
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const url = urlInput.value;
            if (!url) return;

            // UI updates
            resultContainer.style.display = 'none';
            loader.style.display = 'block';
            fetchBtn.disabled = true;

            try {
                const formData = new FormData();
                formData.append('url', url);

                const response = await fetch('/api/fetch-video', {
                    method: 'POST',
                    body: formData
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || 'Failed to fetch video details.');
                }

                renderResults(data);
            } catch (err) {
                alert('Error: ' + err.message);
            } finally {
                loader.style.display = 'none';
                fetchBtn.disabled = false;
            }
        });
    }

    function renderResults(data) {
        // Thumbnail
        document.getElementById('video-thumbnail').src = data.thumbnail || 'https://via.placeholder.com/300x200?text=No+Thumbnail';
        
        // Title
        document.getElementById('video-title').textContent = data.title || 'Video Title';

        // Platform Badge
        const platformKey = data.platform.toLowerCase();
        let pInfo = platforms[platformKey];
        if (!pInfo) pInfo = { name: 'Unknown', icon: 'fa-video', color: 'var(--primary)' };
        
        const badge = document.getElementById('video-platform');
        badge.innerHTML = `<i class="fa-brands ${pInfo.icon}"></i> ${pInfo.name}`;
        badge.style.color = pInfo.color;
        badge.style.borderColor = pInfo.color;

        // Formats
        const formatsContainer = document.getElementById('download-options');
        formatsContainer.innerHTML = '';

        if (data.formats && data.formats.length > 0) {
            data.formats.forEach(f => {
                const btn = document.createElement('a');
                btn.href = f.url;
                btn.target = '_blank';
                btn.className = 'btn-download';
                // Show resolution or fallback to normal download text
                const resolutionText = f.quality ? `${f.quality} (${f.ext})` : `Download (${f.ext})`;
                const sizeText = f.size ? f.size : '';
                
                btn.innerHTML = `${resolutionText} <span>${sizeText}</span> <i class="fa-solid fa-download"></i>`;
                formatsContainer.appendChild(btn);
            });
        } else {
            formatsContainer.innerHTML = '<p>No download formats found.</p>';
        }

        resultContainer.style.display = 'block';
        resultContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // Auto-fetch if URL is prefilled (e.g. from Chrome extension)
    if (urlInput.value) {
        urlInput.dispatchEvent(new Event('input'));
        setTimeout(() => {
            fetchBtn.click();
        }, 500);
    }
});
