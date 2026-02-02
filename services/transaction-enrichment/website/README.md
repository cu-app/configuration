# CU.APP Website

This folder contains the commercial website for the Transaction Enrichment API.

## Files

- **index.html** - Landing page with pricing and features
- **api-docs.html** - (TODO) Full API documentation
- **demo.html** - (TODO) Interactive API demo

## Deploy Options

### Option 1: Cloudflare Pages (Recommended)

```bash
# Install Wrangler
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Deploy website
cd website
wrangler pages deploy . --project-name=cuapp-website
```

Your site will be live at: `https://cuapp-website.pages.dev`

### Option 2: Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
cd website
netlify deploy --prod
```

### Option 3: Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
cd website
vercel --prod
```

### Option 4: GitHub Pages

1. Create a GitHub repo
2. Push the `website` folder
3. Enable GitHub Pages in repo settings
4. Your site will be live at: `https://yourusername.github.io/cuapp`

### Option 5: Static Web Host

Upload `index.html` to any web host:
- AWS S3 + CloudFront
- Google Cloud Storage
- Azure Static Web Apps
- Traditional web hosting (cPanel, etc.)

## Custom Domain

After deploying, add your custom domain:

### For Cloudflare Pages
1. Go to Pages → cuapp-website → Custom domains
2. Add `api.cuapp.com` or `www.cuapp.com`
3. DNS is automatically configured

### For Other Hosts
Add CNAME record:
```
www.cuapp.com → your-deployment-url
```

## Update API Endpoint

Replace placeholder URLs in `index.html`:

```html
<!-- Find and replace -->
https://api.cuapp.com/v1 → Your actual API endpoint
https://cuapp.com/signup → Your signup page
https://cuapp.com/demo → Your demo page
```

## Analytics

Add Google Analytics or Plausible:

```html
<!-- Add before </head> -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

## Live Chat (Optional)

Add Intercom or Crisp:

```html
<!-- Add before </body> -->
<script>
  window.Intercom("boot", {
    app_id: "YOUR_APP_ID"
  });
</script>
```

## SEO

The page includes:
- ✅ Meta title and description
- ✅ Semantic HTML structure
- ✅ Mobile-responsive design
- ✅ Fast loading time

To improve:
1. Add `sitemap.xml`
2. Add `robots.txt`
3. Set up SSL certificate
4. Submit to Google Search Console

## A/B Testing

Test different pricing or messaging:

```html
<!-- Use tools like -->
Google Optimize
VWO
Optimizely
```

## Conversion Tracking

Track signups and demos:

```javascript
// When user clicks "Start Free Trial"
gtag('event', 'conversion', {
  'send_to': 'AW-CONVERSION_ID/CONVERSION_LABEL'
});
```

---

**Ready to launch? Deploy in 5 minutes!**
