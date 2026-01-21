/**
 * Strapi Media Upload Client
 *
 * Handles image upload to Strapi Cloud
 */

import { getConfig } from '../config/index.js';
import type { StrapiMediaUpload } from '../types/index.js';

/**
 * Upload an image buffer to Strapi
 */
export async function uploadImage(
  imageBuffer: Buffer,
  filename: string,
  altText: string
): Promise<StrapiMediaUpload> {
  const config = getConfig();

  // Create form data with the image
  const formData = new FormData();
  const blob = new Blob([imageBuffer], { type: 'image/png' });
  formData.append('files', blob, filename);
  formData.append(
    'fileInfo',
    JSON.stringify({
      alternativeText: altText,
      caption: altText,
    })
  );

  const response = await fetch(`${config.strapi.url}/api/upload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.strapi.apiToken}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to upload image: ${response.status} - ${error}`);
  }

  const uploaded = (await response.json()) as StrapiMediaUpload[];

  if (!uploaded || uploaded.length === 0) {
    throw new Error('No media returned from upload');
  }

  return uploaded[0];
}

/**
 * Upload image from URL (downloads then uploads to Strapi)
 */
export async function uploadImageFromUrl(
  imageUrl: string,
  filename: string,
  altText: string
): Promise<StrapiMediaUpload> {
  // Download the image
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Failed to download image from URL: ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Upload to Strapi
  return uploadImage(buffer, filename, altText);
}

/**
 * Link a media item to an article's cover field
 */
export async function linkCoverToArticle(
  articleDocumentId: string,
  mediaId: number
): Promise<void> {
  const config = getConfig();

  const response = await fetch(
    `${config.strapi.url}/api/articles/${articleDocumentId}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.strapi.apiToken}`,
      },
      body: JSON.stringify({
        data: {
          cover: mediaId,
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to link cover to article: ${response.status} - ${error}`);
  }
}
