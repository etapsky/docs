// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  site: 'https://docs.etapsky.com',

  integrations: [
    starlight({
      title: 'Etapsky Docs',
      tagline: 'Smart Document Format — Developer Documentation',

      logo: {
        light: './public/etapsky_logo.svg',
        dark:  './public/etapsky_logo_dark.svg',
        replacesTitle: true,
      },

      favicon: '/favicon.svg',

      social: {
        github:  'https://github.com/etapsky',
        'x.com': 'https://x.com/etapsky',
        blueSky: 'https://bsky.app/profile/etapsky.bsky.social',
      },

      editLink: {
        baseUrl: 'https://github.com/etapsky/docs/edit/main/',
      },

      lastUpdated: true,
      pagination: true,

      customCss: ['./src/styles/custom.css'],

      components: {
        ThemeSelect:  './src/components/ThemeSelect.astro',
        SiteTitle:    './src/components/SiteTitle.astro',
        SocialIcons:  './src/components/PortalLinks.astro',
      },

      expressiveCode: {
        themes: ['one-dark-pro'],
        styleOverrides: {
          borderRadius: '8px',
          borderColor: '#3e4452',
          frames: {
            frameBoxShadowCssValue: 'none',
          },
        },
      },

      head: [
        // Social icon links — open in new tab
        {
          tag: 'script',
          content: `document.addEventListener('DOMContentLoaded',()=>{document.querySelectorAll('.social-icons a').forEach(a=>{a.setAttribute('target','_blank');a.setAttribute('rel','noopener noreferrer');});});`,
        },
        // Open Graph
        {
          tag: 'meta',
          attrs: { property: 'og:image', content: 'https://docs.etapsky.com/og/default.png' },
        },
        {
          tag: 'meta',
          attrs: { property: 'og:site_name', content: 'Etapsky Docs' },
        },
        // Twitter Card
        {
          tag: 'meta',
          attrs: { name: 'twitter:card', content: 'summary_large_image' },
        },
        {
          tag: 'meta',
          attrs: { name: 'twitter:site', content: '@etapsky' },
        },
        {
          tag: 'meta',
          attrs: { name: 'twitter:image', content: 'https://docs.etapsky.com/og/default.png' },
        },
        // Theme color (browser UI on mobile)
        {
          tag: 'meta',
          attrs: { name: 'theme-color', content: '#09090B' },
        },
      ],

      sidebar: [
        // ── ETAPSKY ──────────────────────────────────────────────
        {
          label: 'Etapsky',
          items: [
            { label: 'Overview',    link: '/' },
            { label: 'About',       link: '/company/' },
            { label: 'Products',    link: '/company/products/' },
            { label: 'Open Source', link: '/company/open-source/' },
            { label: 'Changelog',   link: '/changelog/' },
          ],
        },

        // ── API REFERENCE ─────────────────────────────────────────
        {
          label: 'API Reference',
          items: [
            { label: 'Overview',    link: '/api/' },
          ],
        },

        // ── SDF ──────────────────────────────────────────────────
        {
          label: 'SDF',
          items: [
            { label: 'Introduction', link: '/sdf/' },
          ],
        },
        {
          label: 'Getting Started',
          collapsed: false,
          items: [
            { label: 'Quickstart',    link: '/sdf/getting-started/quickstart/' },
            { label: 'Installation',  link: '/sdf/getting-started/installation/' },
            { label: 'Core Concepts', link: '/sdf/getting-started/concepts/' },
          ],
        },
        {
          label: 'Format Specification',
          collapsed: true,
          items: [
            { label: 'Overview',     link: '/sdf/spec/' },
            { label: 'Container',    link: '/sdf/spec/container/' },
            { label: 'meta.json',    link: '/sdf/spec/meta-layer/' },
            { label: 'data.json',    link: '/sdf/spec/data-layer/' },
            { label: 'schema.json',  link: '/sdf/spec/schema-layer/' },
            { label: 'visual.pdf',   link: '/sdf/spec/visual-layer/' },
            { label: 'Signing',      link: '/sdf/spec/signing/' },
            { label: 'Validation',   link: '/sdf/spec/validation/' },
            { label: 'Versioning',   link: '/sdf/spec/versioning/' },
            { label: 'Error Codes',  link: '/sdf/spec/error-codes/' },
          ],
        },
        {
          label: 'sdf-kit',
          badge: { text: 'v0.2.2', variant: 'tip' },
          collapsed: true,
          items: [
            { label: 'Overview',   link: '/sdf/sdf-kit/' },
            { label: 'Producer',   link: '/sdf/sdf-kit/producer/' },
            { label: 'Reader',     link: '/sdf/sdf-kit/reader/' },
            { label: 'Validator',  link: '/sdf/sdf-kit/validator/' },
            { label: 'Signer',     link: '/sdf/sdf-kit/signer/' },
            { label: 'Types',      link: '/sdf/sdf-kit/types/' },
          ],
        },
        {
          label: 'sdf-cli',
          badge: { text: 'v0.3.0', variant: 'tip' },
          collapsed: true,
          items: [
            { label: 'Overview',  link: '/sdf/sdf-cli/' },
            { label: 'inspect',   link: '/sdf/sdf-cli/inspect/' },
            { label: 'validate',  link: '/sdf/sdf-cli/validate/' },
            { label: 'sign',      link: '/sdf/sdf-cli/sign/' },
            { label: 'verify',    link: '/sdf/sdf-cli/verify/' },
            { label: 'keygen',    link: '/sdf/sdf-cli/keygen/' },
            { label: 'wrap',      link: '/sdf/sdf-cli/wrap/' },
            { label: 'convert',   link: '/sdf/sdf-cli/convert/' },
            { label: 'schema',    link: '/sdf/sdf-cli/schema/' },
          ],
        },
        {
          label: 'Schema Registry',
          badge: { text: 'v0.1.0', variant: 'note' },
          collapsed: true,
          items: [
            { label: 'Overview',  link: '/sdf/sdf-schema-registry/' },
            { label: 'Registry',  link: '/sdf/sdf-schema-registry/registry/' },
            { label: 'Diff',      link: '/sdf/sdf-schema-registry/diff/' },
            { label: 'Migrate',   link: '/sdf/sdf-schema-registry/migrate/' },
          ],
        },
        {
          label: 'SDF Server',
          collapsed: true,
          items: [
            { label: 'Overview',        link: '/sdf/sdf-server/' },
            { label: 'Endpoints',       link: '/sdf/sdf-server/endpoints/' },
            { label: 'Authentication',  link: '/sdf/sdf-server/authentication/' },
            { label: 'Queue',           link: '/sdf/sdf-server/queue/' },
            { label: 'Storage',         link: '/sdf/sdf-server/storage/' },
            { label: 'Database',        link: '/sdf/sdf-server/database/' },
            { label: 'Environment',     link: '/sdf/sdf-server/environment/' },
          ],
        },
        {
          label: 'Python SDK',
          badge: { text: 'v0.1.1 · PyPI', variant: 'tip' },
          collapsed: true,
          items: [
            { label: 'Overview',   link: '/sdf/sdk-python/' },
            { label: 'Producer',   link: '/sdf/sdk-python/producer/' },
            { label: 'Reader',     link: '/sdf/sdk-python/reader/' },
            { label: 'Validator',  link: '/sdf/sdk-python/validator/' },
            { label: 'Signer',     link: '/sdf/sdk-python/signer/' },
            { label: 'Types',      link: '/sdf/sdk-python/types/' },
          ],
        },
        {
          label: 'Cloud SDK',
          badge: { text: 'v0.1.0', variant: 'note' },
          collapsed: true,
          items: [
            { label: 'Overview',        link: '/sdf/cloud-sdk/' },
            { label: 'Authentication',  link: '/sdf/cloud-sdk/authentication/' },
            { label: 'Reference',       link: '/sdf/cloud-sdk/reference/' },
          ],
        },
        {
          label: 'Integrations',
          collapsed: true,
          items: [
            { label: 'Overview',      link: '/sdf/integrations/' },
            { label: 'SAP S/4HANA',  link: '/sdf/integrations/sap/' },
            { label: 'Oracle Fusion', link: '/sdf/integrations/oracle/' },
            { label: 'Webhooks',      link: '/sdf/integrations/webhook/' },
            { label: 'SAML SSO',      link: '/sdf/integrations/saml-sso/' },
            { label: 'Custom ERP',    link: '/sdf/integrations/erp-custom/' },
          ],
        },
        {
          label: 'Developer Tools',
          collapsed: true,
          items: [
            { label: 'VS Code', link: '/sdf/tooling/vscode/' },
            { label: 'macOS',   link: '/sdf/tooling/macos/' },
            { label: 'Windows', link: '/sdf/tooling/windows/' },
          ],
        },
        {
          label: 'Examples',
          collapsed: true,
          items: [
            { label: 'Overview',                    link: '/sdf/examples/' },
            { label: 'Invoice (B2B)',                link: '/sdf/examples/invoice/' },
            { label: 'Nomination (B2B)',             link: '/sdf/examples/nomination/' },
            { label: 'Purchase Order (B2B)',         link: '/sdf/examples/purchase-order/' },
            { label: 'Tax Declaration (B2G)',        link: '/sdf/examples/gov-tax-declaration/' },
            { label: 'Customs Declaration',          link: '/sdf/examples/gov-customs-declaration/' },
            { label: 'Permit Application (B2G)',     link: '/sdf/examples/gov-permit-application/' },
            { label: 'Health Report (B2G/G2G)',      link: '/sdf/examples/gov-health-report/' },
          ],
        },
        {
          label: 'Reference',
          collapsed: true,
          items: [
            { label: 'Error Codes',  link: '/sdf/reference/error-codes/' },
            { label: 'JSON Schemas', link: '/sdf/reference/schema-json/' },
            { label: 'Changelog',    link: '/sdf/reference/changelog/' },
            { label: 'FAQ',          link: '/sdf/reference/faq/' },
          ],
        },
      ],
    }),
  ],
});
