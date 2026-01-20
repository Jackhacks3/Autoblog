/**
 * article controller
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::article.article', ({ strapi }) => ({
  // Override find to add custom logic
  async find(ctx) {
    // Only return published articles by default for public API
    if (!ctx.state.user) {
      const existingFilters = ctx.query.filters || {};
      ctx.query.filters = {
        ...(typeof existingFilters === 'object' ? existingFilters : {}),
        status: 'published',
      };
    }

    const { data, meta } = await super.find(ctx);
    return { data, meta };
  },
}));
