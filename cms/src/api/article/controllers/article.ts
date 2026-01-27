/**
 * article controller
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::article.article', ({ strapi }) => ({
  async find(ctx) {
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

  async create(ctx) {
    await super.create(ctx);
    const data = ctx.body?.data;
    const wantPublish = ctx.query?.status === 'published';
    if (wantPublish && data?.documentId) {
      try {
        await strapi.documents('api::article.article').publish({
          documentId: data.documentId,
        });
      } catch (e) {
        strapi.log.warn('article create: publish failed', e);
      }
    }
  },
}));
