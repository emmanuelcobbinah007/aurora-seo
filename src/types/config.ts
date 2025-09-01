export interface SEOConfig {
  siteUrl: string;
  features: {
    sitemap: boolean;
    robots: boolean;
    meta: boolean;
  };
  paths: {
    sitemap: string;
    robots: string;
  };
  sitemap?: {
    include?: string[];
    exclude?: string[];
    additionalPaths?: string[];
    changefreq?:
      | "always"
      | "hourly"
      | "daily"
      | "weekly"
      | "monthly"
      | "yearly"
      | "never";
    priority?: number;
  };
  robots?: {
    userAgent?: string;
    disallow?: string[];
    allow?: string[];
    crawlDelay?: number | null;
    host?: string | null;
  };
  metadata?: {
    title?: string;
    description?: string;
    keywords?: string[];
    author?: string;
    openGraph?: {
      title?: string;
      description?: string;
      image?: string;
      type?: string;
    };
    twitter?: {
      title?: string;
      description?: string;
      image?: string;
      card?: "summary" | "summary_large_image";
    };
  };
  googleSearchConsole?: {
    enabled: boolean;
    method: "meta" | "html";
    value: string;
    originalInput?: string;
    fileName?: string;
  };
}
