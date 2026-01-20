/**
 * Article lifecycle hooks
 */

// Calculate reading time from content
function calculateReadingTime(content: string): number {
  if (!content) return 1;

  // Strip HTML tags if present
  const text = content.replace(/<[^>]*>/g, '');
  const wordsPerMinute = 200;
  const wordCount = text.split(/\s+/).filter(Boolean).length;

  return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
}

export default {
  beforeCreate(event) {
    const { data } = event.params;

    // Auto-calculate reading time
    if (data.content && !data.readingTime) {
      data.readingTime = calculateReadingTime(data.content);
    }

    // Set lastUpdated
    data.lastUpdated = new Date();
  },

  beforeUpdate(event) {
    const { data } = event.params;

    // Recalculate reading time if content changed
    if (data.content) {
      data.readingTime = calculateReadingTime(data.content);
    }

    // Update lastUpdated timestamp
    data.lastUpdated = new Date();
  },
};
