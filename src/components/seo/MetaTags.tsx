import Head from 'next/head';
import { useRouter } from 'next/router';

interface MetaTagsProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  type?: 'website' | 'article';
  publishedAt?: string;
  updatedAt?: string;
  author?: string;
  section?: string;
  canonicalUrl?: string;
}

const siteConfig = {
  name: 'LeadLink CRM',
  url: 'https://leadlink-crm.com',
  logoUrl: 'https://leadlink-crm.com/icons/icon-512x512.png',
  twitter: '@leadlinkcrm',
}

export const MetaTags: React.FC<MetaTagsProps> = ({
  title,
  description = 'Comprehensive CRM system for managing leads and customers',
  keywords = 'crm, leads, customers, sales, management',
  image = siteConfig.logoUrl,
  type = 'website',
  publishedAt,
  updatedAt,
  author = 'LeadLink Team',
  section,
  canonicalUrl,
}) => {
  const router = useRouter();
  const pageTitle = title ? `${title} | ${siteConfig.name}` : siteConfig.name;
  const currentUrl = `${siteConfig.url}${router.asPath}`;
  const finalCanonicalUrl = canonicalUrl || currentUrl;

  return (
    <Head>
      {/* Basic Meta Tags */}
      <title>{pageTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      
      {/* Canonical URL */}
      <link rel="canonical" href={finalCanonicalUrl} />
      
      {/* Open Graph */}
      <meta property="og:site_name" content={siteConfig.name} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      <meta property="og:image" content={image} />
      <meta property="og:image:alt" content={pageTitle} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content={siteConfig.twitter} />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      
      {/* Article Specific (if applicable) */}
      {type === 'article' && publishedAt && (
        <meta property="article:published_time" content={publishedAt} />
      )}
      {type === 'article' && updatedAt && (
        <meta property="article:modified_time" content={updatedAt} />
      )}
      {type === 'article' && author && (
        <meta property="article:author" content={author} />
      )}
      {type === 'article' && section && (
        <meta property="article:section" content={section} />
      )}
    </Head>
  );
}; 