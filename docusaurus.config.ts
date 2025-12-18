import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'Hackathon Native Book – Physical AI & Humanoid Robotics',
  tagline: 'A Comprehensive Guide to Building Intelligent Robots',
  favicon: 'img/favicon.ico',

  // ✅ Vercel deployment ke liye updated settings
  url: 'https://physical-ai-humanoid-robotics-book-eosin.vercel.app/',
  baseUrl: '/',

  // ✅ GitHub Pages wali settings comment out kardi hain
  // organizationName: 'panaversity',
  // projectName: 'physical-ai-book',

  onBrokenLinks: 'ignore',
  onBrokenMarkdownLinks: 'warn',

  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'ur', 'es'],
  },

  customFields: {
    // Single source of truth for all API endpoints
    // Update API_BASE_URL in .env for local development or Vercel environment variables for production
    apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:3001',
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: require.resolve('./sidebars.ts'),
          routeBasePath: '/docs',
        },
        blog: false,
        theme: {
          customCss: [require.resolve('./src/css/unified-styles.css'), require.resolve('./src/css/custom.css')],
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/docusaurus-social-card.jpg',

    colorMode: {
      defaultMode: 'light',
      disableSwitch: false,
      respectPrefersColorScheme: true,
    },

    navbar: {
      title: 'Physical AI & Humanoid Robotics',
      logo: {
        alt: 'Physical AI & Humanoid Robotics Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'tutorialSidebar',
          position: 'left',
          label: 'Docs',
        },
        {
          type: 'custom-languageSwitcher',
          position: 'right',
        },
        {
          type: 'custom-auth',
          position: 'right',
        },
      ],
    },

    footer: {
      style: 'dark',
      links: [
        {
          title: 'Creator / Developer',
          items: [
            {
              label: 'Noor Ul Sehar',
              href: 'https://github.com/nh7220869',
            },
          ],
        },
        {
          title: 'External Links',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/nh7220869',
            },
          ],
        },
      ],
      copyright:
        `Copyright © ${new Date().getFullYear()} Physical AI & Humanoid Robotics.`,
    },

    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;