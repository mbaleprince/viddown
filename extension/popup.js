document.addEventListener('DOMContentLoaded', async () => {
  const urlDisplay = document.getElementById('current-url');
  const downloadBtn = document.getElementById('download-btn');
  const webAppBtn = document.getElementById('open-web-app');
  
  // Replace this with the actual domain where the Flask app is hosted
  const WEB_APP_URL = 'http://127.0.0.1:5000'; 

  let currentUrl = '';

  // Get current tab URL
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    currentUrl = tab.url;
    
    // Check if it's a social media URL
    const isValidPlatform = /(youtube\.com|youtu\.be|tiktok\.com|facebook\.com|fb\.watch|instagram\.com|twitter\.com|x\.com)/i.test(currentUrl);
    
    if (isValidPlatform) {
      urlDisplay.textContent = currentUrl;
      urlDisplay.style.color = '#3ddc84'; // Green
      downloadBtn.disabled = false;
    } else {
      urlDisplay.textContent = 'Not a supported video platform.';
      urlDisplay.style.color = 'var(--secondary)'; // Red/Pink
    }
  } catch (error) {
    urlDisplay.textContent = 'Unable to get active tab.';
  }

  // Handle Download Click
  downloadBtn.addEventListener('click', () => {
    // Open the web app and pass the URL as a query parameter or simulate pasting
    // For simplicity, we just open the web app. In a real scenario, you could pass ?url=...
    chrome.tabs.create({ url: `${WEB_APP_URL}?url=${encodeURIComponent(currentUrl)}` });
  });

  // Handle Open Web App click
  webAppBtn.addEventListener('click', (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: WEB_APP_URL });
  });
});
