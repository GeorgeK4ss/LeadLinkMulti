import React from 'react';

interface Organization {
  name: string;
  url: string;
  logo: string;
  sameAs?: string[];
}

interface WebsiteSchema {
  url: string;
  name: string;
  description: string;
}

interface BreadcrumbItem {
  name: string;
  url: string;
}

interface StructuredDataProps {
  type: 'organization' | 'website' | 'product' | 'breadcrumbs';
  data: Organization | WebsiteSchema | any | BreadcrumbItem[];
}

// Default organization data
const defaultOrg: Organization = {
  name: 'LeadLink CRM',
  url: 'https://leadlink-crm.com',
  logo: 'https://leadlink-crm.com/icons/icon-512x512.png',
  sameAs: [
    'https://twitter.com/leadlinkcrm',
    'https://linkedin.com/company/leadlinkcrm',
  ],
};

// Default website data
const defaultWebsite: WebsiteSchema = {
  name: 'LeadLink CRM',
  url: 'https://leadlink-crm.com',
  description: 'Comprehensive CRM system for managing leads and customers',
};

export const StructuredData: React.FC<StructuredDataProps> = ({ type, data }) => {
  let structuredData = {};

  switch (type) {
    case 'organization':
      const orgData = { ...defaultOrg, ...data } as Organization;
      structuredData = {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: orgData.name,
        url: orgData.url,
        logo: orgData.logo,
        sameAs: orgData.sameAs,
      };
      break;

    case 'website':
      const websiteData = { ...defaultWebsite, ...data } as WebsiteSchema;
      structuredData = {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: websiteData.name,
        url: websiteData.url,
        description: websiteData.description,
        potentialAction: {
          '@type': 'SearchAction',
          target: `${websiteData.url}/search?q={search_term_string}`,
          'query-input': 'required name=search_term_string',
        },
      };
      break;

    case 'product':
      structuredData = {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: data.name,
        description: data.description,
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
        offers: {
          '@type': 'Offer',
          price: data.price || '0',
          priceCurrency: data.currency || 'USD',
        },
        ...(data.aggregateRating && {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: data.aggregateRating.ratingValue,
            ratingCount: data.aggregateRating.ratingCount,
          },
        }),
      };
      break;

    case 'breadcrumbs':
      const breadcrumbItems = data as BreadcrumbItem[];
      structuredData = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: breadcrumbItems.map((item, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: item.name,
          item: item.url,
        })),
      };
      break;

    default:
      structuredData = {};
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}; 