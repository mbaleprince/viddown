import os
from flask import Flask, render_template, request, jsonify

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'default_secret_key_change_in_production')

import datetime

@app.context_processor
def inject_now():
    return {'current_year': datetime.datetime.now().year}

@app.route('/')
def index():
    url_param = request.args.get('url', '')
    return render_template('index.html', prefill_url=url_param)

@app.route('/robots.txt')
def robots():
    return "User-agent: *\nAllow: /\nSitemap: https://viddown.westniles.com/sitemap.xml", 200, {'Content-Type': 'text/plain'}

@app.route('/sitemap.xml')
def sitemap():
    xml = '''<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://viddown.westniles.com/</loc><priority>1.0</priority></url>
  <url><loc>https://viddown.westniles.com/about</loc><priority>0.8</priority></url>
  <url><loc>https://viddown.westniles.com/faq</loc><priority>0.8</priority></url>
  <url><loc>https://viddown.westniles.com/contact</loc><priority>0.8</priority></url>
</urlset>'''
    return xml, 200, {'Content-Type': 'application/xml'}

@app.route('/about')
def about():
    return render_template('about.html')

@app.route('/faq')
def faq():
    return render_template('faq.html')

@app.route('/contact')
def contact():
    return render_template('contact.html')

# --- API Endpoints ---

@app.route('/api/fetch-video', methods=['POST'])
def fetch_video():
    url = request.form.get('url')
    if not url:
        return jsonify({'error': 'URL is required'}), 400
    
    try:
        from yt_dlp import YoutubeDL
        ydl_opts = {
            'quiet': True,
            'no_warnings': True,
            'cachedir': False,
        }
        with YoutubeDL(ydl_opts) as ydl:
            # Extract info
            info_dict = ydl.extract_info(url, download=False)
            
            title = info_dict.get('title', 'Unknown Title')
            thumbnail = info_dict.get('thumbnail', '')
            platform = info_dict.get('extractor_key', 'unknown')
            
            formats = []
            
            if 'formats' in info_dict:
                for f in info_dict['formats']:
                    # We want formats with video or audio and a valid URL
                    if f.get('url') and f['url'].startswith('http'):
                        # Skip if there's no interesting codec
                        if f.get('vcodec') == 'none' and f.get('acodec') == 'none':
                            continue
                            
                        quality = f.get('format_note') or f.get('resolution') or f.get('quality') or 'Standard'
                        ext = f.get('ext', 'mp4')
                        size_mb = round(f.get('filesize', 0) / 1024 / 1024, 1) if f.get('filesize') else None
                        size_str = f"{size_mb} MB" if size_mb else "Size unknown"
                        
                        formats.append({
                            'quality': quality,
                            'url': f['url'],
                            'ext': ext,
                            'size': size_str,
                            'width': f.get('width', 0)
                        })
            elif url := info_dict.get('url'):
                # Some extractors just return a single direct URL
                formats.append({
                    'quality': 'Standard',
                    'url': url,
                    'ext': info_dict.get('ext', 'mp4'),
                    'size': 'Size unknown',
                    'width': 0
                })
                
            # Clean up and filter duplicates, preferring versions with video
            # Sort by resolution/width primarily
            formats = sorted(formats, key=lambda x: x.get('width') if isinstance(x.get('width'), int) else 0, reverse=True)
            
            unique_formats = []
            seen_qualities = set()
            for f in formats:
                if f['quality'] not in seen_qualities:
                    unique_formats.append(f)
                    seen_qualities.add(f['quality'])
                    
            return jsonify({
                'status': 'success',
                'platform': platform,
                'title': title,
                'thumbnail': thumbnail,
                'formats': unique_formats[:8] # Send top 8 formats
            })
            
    except Exception as e:
        return jsonify({'error': 'Failed to process video: ' + str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=6000)
