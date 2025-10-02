import { ReactNode } from 'react';

type PlaceholderFactory = (identifier: string) => string;

type ForumFolderCopy = {
  name: string;
  badgeLabel: string;
  description: string;
};

type AccountCopy = {
  headings: {
    loggedIn: string;
    login: string;
    register: string;
  };
  descriptions: {
    loggedIn: (email: string) => string;
    login: string;
    register: string;
  };
  buttons: {
    login: string;
    register: string;
    logout: string;
    switchAccount: string;
    submit: {
      waiting: string;
    };
  };
  form: {
    emailLabel: string;
    passwordLabel: string;
    passwordHelper: string;
  };
  status: {
    signedInTitle: string;
  };
};

type FooterCopy = {
  heading: string;
  tagline: string;
  contactLabel: string;
  supportEmail: string;
  phone: string;
  address: string;
  businessHours: string;
  cvr: string;
  copyright: (year: number) => ReactNode;
};

type ProductCopy = {
  filters: {
    all: string;
  };
  heading: string;
  subheading: string;
  emptyState: string;
  actionLabel: string;
  placeholders: {
    title: string;
    description: PlaceholderFactory;
    indexDescription: string;
  };
  priceLabels: {
    exVat: string;
    vat: string;
  };
  errors: {
    missingCollection: string;
  };
};

type ForumCopy = {
  heading: string;
  subheading: string;
  directoryLabel: string;
  cta: string;
  placeholders: {
    title: string;
    description: PlaceholderFactory;
    indexDescription: string;
  };
  folders: {
    globalChat: ForumFolderCopy;
    explainLikeImFive: ForumFolderCopy;
  };
};

type NotFoundCopy = {
  title: string;
  description: string;
};

type NavigationCopy = {
  tabs: {
    products: string;
    forums: string;
    account: string;
  };
  authButtons: {
    login: string;
    register: string;
  };
};

export const siteCopy: {
  navigation: NavigationCopy;
  products: ProductCopy;
  forums: ForumCopy;
  account: AccountCopy;
  footer: FooterCopy;
  notFound: NotFoundCopy;
} = {
  navigation: {
    tabs: {
      products: 'Products',
      forums: 'Forums',
      account: 'Account',
    },
    authButtons: {
      login: 'Log in',
      register: 'Create account',
    },
  },
  products: {
    filters: {
      all: 'All',
    },
    heading: 'Zora Collection',
    subheading: 'Curated home goods crafted by independent artisans. Updated daily from the Zora API.',
    emptyState: 'No products available in this category yet.',
    actionLabel: 'View details',
    placeholders: {
      title: 'Coming soon',
      description: (identifier: string) => `Product route �${identifier}� is reserved for a future experience. Check back again soon.`,
      indexDescription: 'Product sub-route is reserved for a future experience. Check back again soon.',
    },
    priceLabels: {
      exVat: 'ekskl. moms',
      vat: 'moms',
    },
    errors: {
      missingCollection: 'API response missing products collection',
    },
  },
  forums: {
    heading: 'Community Forums',
    subheading:
      'Explore discussion spaces that feel like a tidy directory of workshops. Choose a folder to meet the people behind Zora or tap into AI-powered explainers.',
    directoryLabel: 'Forums Directory',
    cta: 'Request Early Access',
    placeholders: {
      title: 'Forums are expanding soon',
      description: (identifier: string) => `Forum route �${identifier}� will host community features in an upcoming release.`,
      indexDescription: 'Forum sub-route will host community features in an upcoming release.',
    },
    folders: {
      globalChat: {
        name: 'Global Chat Forum',
        badgeLabel: 'Human',
        description: 'Open dialogues with shoppers, makers, and curators across the Zora community.',
      },
      explainLikeImFive: {
        name: "Explain Like I'm Five",
        badgeLabel: 'AI',
        description: 'Ask the assistant anything about materials, care, or styling and get plain-language answers.',
      },
    },
  },
  account: {
    headings: {
      loggedIn: 'Your Zora account',
      login: 'Welcome back',
      register: 'Join Zora Cora',
    },
    descriptions: {
      loggedIn: (email: string) => `You are signed in as ${email}. Use the options below to manage your session.`,
      login: 'Log in to access personalised recommendations and community features.',
      register: 'Create an account to save favourites and participate in the community forums.',
    },
    buttons: {
      login: 'Log in',
      register: 'Create account',
      logout: 'Sign out',
      switchAccount: 'Switch account',
      submit: {
        waiting: 'Please wait...',
      },
    },
    form: {
      emailLabel: 'Email address',
      passwordLabel: 'Password',
      passwordHelper: 'Use at least 8 characters.',
    },
    status: {
      signedInTitle: "You're signed in",
    },
  },
  footer: {
    heading: 'Zora Core',
    tagline: 'Powered with love by WG.',
    contactLabel: 'Contact:',
    supportEmail: 'support@zora.shop',
    phone: 'Phone: +45 xx-xx-xx-xx',
    address: '123 Artisan Way, Portland, OR',
    businessHours: 'Business Hours: Mon-Fri 9am-6pm PT',
    cvr: 'CVR: 37750514',
    copyright: (year: number) => `Copyright ${year} Zora Legal LLC. All rights reserved.`,
  },
  notFound: {
    title: 'Page not found',
    description: 'The page you are looking for could not be found. Try choosing another section from the main navigation.',
  },
};

export const notifications = {
  auth: {
    invalidEmail: 'Please enter a valid email address.',
    passwordTooShort: 'Password must be at least 8 characters.',
    loginFailure: 'Unable to log in. Please try again.',
    registerFailure: 'Unable to create account. Please try again.',
    loginSuccess: 'Logged in successfully.',
    registerSuccess: 'Account created successfully.',
    logoutSuccess: 'You have been signed out.',
    unexpectedResponse: 'Unexpected response from server.',
    genericError: 'Something went wrong. Please try again.',
  },
};
