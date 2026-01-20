const config = {
  locales: ['en'],
  translations: {
    en: {
      'app.components.LeftMenu.navbrand.title': 'AUTOBLOG CMS',
      'app.components.LeftMenu.navbrand.workplace': 'Dashboard',
      'Auth.form.welcome.title': 'Welcome to AUTOBLOG',
      'Auth.form.welcome.subtitle': 'Log in to manage your content',
    },
  },
  // Disable video tutorials
  tutorials: false,
  // Disable notifications about new Strapi releases
  notifications: { releases: false },
};

const bootstrap = () => {};

export default {
  config,
  bootstrap,
};
