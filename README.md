# luris.com.au website

This repository is now configured as a static GitHub Pages website for the custom domain **luris.com.au**.

## What's included

- `index.html` + `styles.css` for the live landing page.
- `CNAME` set to `luris.com.au` so GitHub Pages serves this custom domain.

## GitHub Pages settings

1. In this repository, open **Settings → Pages**.
2. Under **Build and deployment**, choose:
   - **Source:** `Deploy from a branch`
   - **Branch:** `main` (or your default branch), `/ (root)`
3. Confirm the custom domain field shows `luris.com.au`.
4. Enable **Enforce HTTPS** once DNS is active.

## DNS records to configure

At your DNS provider, set these records:

### Apex domain (`luris.com.au`)
Use A records pointing to GitHub Pages:

- `185.199.108.153`
- `185.199.109.153`
- `185.199.110.153`
- `185.199.111.153`

### `www` subdomain (`www.luris.com.au`)
Use a CNAME record:

- `www` → `bobby114i.github.io`

Both the apex and www records must be configured — GitHub Pages checks both when
verifying the custom domain (the www variant is the "alternate name" shown in
Pages settings). Missing either record produces a `NotServedByPagesError`.

After DNS propagates (up to 48 hours), GitHub will provision TLS automatically
and the **Enforce HTTPS** option will become available in Pages settings.
