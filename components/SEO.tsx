import React from 'react';
import { Helmet } from 'react-helmet-async';

interface Props {
    title?: string;
    description?: string;
    canonical?: string;
    type?: 'website' | 'article';
    image?: string;
}

const DEFAULT_TITLE = 'TadkaSync | Your Digital Sous-Chef';
const DEFAULT_DESC = 'Automate your Indian kitchen. Plan meals, generate shopping lists, and cook with confidence using AI.';
const DEFAULT_URL = 'https://tadkasync.com';
const DEFAULT_IMAGE = '/og-image.jpg'; // We need to ensure this exists later

const SEO: React.FC<Props> = ({
    title = DEFAULT_TITLE,
    description = DEFAULT_DESC,
    canonical,
    type = 'website',
    image = DEFAULT_IMAGE
}) => {
    const fullTitle = title === DEFAULT_TITLE ? title : `${title} | TadkaSync`;

    return (
        <Helmet>
            {/* Standard Metadata */}
            <title>{fullTitle}</title>
            <meta name="description" content={description} />
            {canonical && <link rel="canonical" href={canonical} />}

            {/* Open Graph / Facebook */}
            <meta property="og:type" content={type} />
            <meta property="og:url" content={canonical || DEFAULT_URL} />
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={description} />
            <meta property="og:image" content={image} />

            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:url" content={canonical || DEFAULT_URL} />
            <meta name="twitter:title" content={fullTitle} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content={image} />

            {/* Search Engine Config */}
            <meta name="robots" content="index, follow" />
        </Helmet>
    );
};

export default SEO;
