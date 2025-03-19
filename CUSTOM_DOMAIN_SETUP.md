# Setting Up a Custom Domain for LeadLink CRM

This guide will walk you through the process of setting up a custom domain for your LeadLink CRM application hosted on Firebase.

## Prerequisites

- A registered domain name (e.g., from GoDaddy, Namecheap, Google Domains, etc.)
- Access to your domain's DNS settings
- Firebase project with Hosting enabled

## Steps to Set Up Your Custom Domain

### 1. Access Firebase Hosting Settings

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `lead-link-multi-tenant`
3. In the left sidebar, click on **Hosting**
4. Click on **Add custom domain**

### 2. Verify Domain Ownership

1. Enter your domain name (e.g., `leadlink.com` or `app.leadlink.com`)
2. Follow the verification process which typically involves adding TXT records to your domain's DNS settings
3. Wait for verification to complete (this can take up to 24 hours, but usually happens within minutes)

### 3. Configure DNS Settings

Firebase will provide you with two options for connecting your domain:

#### Option A: Using A Records

1. Add an A record pointing to the following IP addresses:
   ```
   151.101.1.195
   151.101.65.195
   ```

2. Wait for DNS propagation (this can take up to 48 hours, but often completes within a few hours)

#### Option B: Using CNAME Records (Recommended for Subdomains)

1. Add a CNAME record for your subdomain (e.g., `app.leadlink.com`) pointing to:
   ```
   lead-link-multi-tenant.web.app
   ```

2. Wait for DNS propagation

### 4. Set Up SSL Certificate

Firebase automatically provisions an SSL certificate for your custom domain. Once your DNS settings have propagated:

1. The certificate will be automatically provisioned
2. Your site will be accessible via HTTPS

## Verifying Your Setup

After configuration and DNS propagation:

1. Visit your custom domain (e.g., `https://app.leadlink.com`)
2. Ensure that the site loads correctly and shows a valid SSL certificate

## Troubleshooting

If your custom domain isn't working as expected:

1. **DNS Hasn't Propagated**: Wait longer for DNS changes to take effect
2. **Incorrect DNS Records**: Double-check all DNS entries for typos
3. **CAA Records**: Ensure your domain doesn't have CAA records that would prevent Firebase from issuing certificates
4. **Multiple A Records**: Make sure you've added all required A records

For further assistance, consult the [Firebase Hosting documentation](https://firebase.google.com/docs/hosting/custom-domain) or contact Firebase support. 