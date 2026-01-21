/**
 * OpenAI Client
 *
 * Wrapper for DALL-E 3 image generation
 */

import OpenAI from 'openai';
import { getConfig } from '../config/index.js';
import type { GeneratedImage } from '../types/index.js';

let client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!client) {
    const config = getConfig();
    client = new OpenAI({
      apiKey: config.openai.apiKey,
    });
  }
  return client;
}

export interface ImageGenerationOptions {
  prompt: string;
  size?: '1024x1024' | '1792x1024' | '1024x1792';
  quality?: 'standard' | 'hd';
  style?: 'natural' | 'vivid';
}

/**
 * Generate an image using DALL-E 3
 */
export async function generateImage(options: ImageGenerationOptions): Promise<GeneratedImage> {
  const openai = getClient();

  const response = await openai.images.generate({
    model: 'dall-e-3',
    prompt: options.prompt,
    n: 1,
    size: options.size || '1792x1024',
    quality: options.quality || 'standard',
    style: options.style || 'natural',
  });

  const imageData = response.data?.[0];
  if (!imageData?.url) {
    throw new Error('No image URL returned from DALL-E');
  }

  // Parse dimensions from size
  const [width, height] = (options.size || '1792x1024').split('x').map(Number);

  return {
    url: imageData.url,
    prompt: options.prompt,
    altText: '', // Will be set by caller
    dimensions: { width, height },
  };
}

/**
 * Download image from URL to buffer
 */
export async function downloadImage(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.status}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
