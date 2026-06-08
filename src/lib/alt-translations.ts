export const translations = {
  en: {
    home: {
      heroBadge: "Since 1975",
      heroTitle: "Pure, Traditional Oils",
      heroSubtitle:
        "Oil mill to your home. Cold-pressed using age-old wooden press methods.",
      exploreProducts: "Explore Products",
      wholesaleInquiry: "Wholesale Inquiry",
    },

    products: {
      sectionTitle: "Our Pure Oils",
      sectionSubtitle:
        "Explore our range of traditionally extracted cold-pressed oils.",
      groundnutOil: "Groundnut Oil",
      coconutOil: "Coconut Oil",
      sesameOil: "Sesame Oil",
      castorOil: "Castor Oil",
      deepamOil: "Deepam Oil",
    },

    whyChooseUs: {
      sectionTitle: "Why Choose Us",

      pureExtraction: {
        title: "Pure Extraction",
        description:
          "Traditional wooden press (chekku) extraction retaining maximum nutrients.",
      },

      directFromMill: {
        title: "Direct From Mill",
        description:
          "No middlemen. Directly sourced from our Theni facility since 1975.",
      },

      msmeCertified: {
        title: "MSME Certified",
        description:
          "Government recognized quality standard and authentic manufacturing.",
      },
    },

    wholesale: {
      title: "Looking for Bulk Orders?",
      description:
        "We supply high-quality cold-pressed oils at wholesale prices for businesses and large family needs.",
      requestQuote: "Request Wholesale Quote",
    },
  },

  ta: {
    home: {
      heroBadge: "1975 முதல்",
      heroTitle: "தூய பாரம்பரிய எண்ணெய்கள்",
      heroTitleFull: "செக்கின் தூய்மை, உங்கள் இல்லம் வரை",
      heroSubtitle:
        "பாரம்பரிய மரச் செக்கு முறையில் தயாரிக்கப்பட்ட தூய இயற்கை எண்ணெய்கள் — செக்கிலிருந்து நேரடியாக உங்கள் இல்லம் வரை.",
      exploreProducts: "தயாரிப்புகளை பார்வையிடுங்கள்",
      wholesaleInquiry: "மொத்த விற்பனை தொடர்புக்கு",
    },

    products: {
      sectionTitle: "எங்கள் எண்ணெய் வகைகள்",
      sectionSubtitle:
        "பாரம்பரிய செக்கு முறையில் தயாரிக்கப்பட்ட தூய இயற்கை எண்ணெய்களின் தொகுப்பு.",
      groundnutOil: "நிலக்கடலை எண்ணெய்",
      coconutOil: "தேங்காய் எண்ணெய்",
      sesameOil: "நல்லெண்ணெய்",
      castorOil: "ஆமணக்கு எண்ணெய்",
      deepamOil: "தீப எண்ணெய்",
    },

    whyChooseUs: {
      sectionTitle: "ஏன் எங்களைத் தேர்வு செய்ய வேண்டும்?",

      pureExtraction: {
        title: "தூய செக்கு முறை",
        description:
          "பாரம்பரிய மரச் செக்கு முறையில் தயாரிக்கப்படுவதால் இயற்கைச் சத்துக்கள் முழுமையாகப் பாதுகாக்கப்படுகின்றன.",
      },

      directFromMill: {
        title: "செக்கிலிருந்து நேரடியாக",
        description:
          "இடைத்தரகர்கள் இன்றி, 1975 முதல் தேனியில் உள்ள எங்கள் செக்கிலிருந்து நேரடியாக வழங்கப்படுகிறது.",
      },

      msmeCertified: {
        title: "MSME சான்றளிக்கப்பட்டது",
        description:
          "அரசு அங்கீகாரம் பெற்ற தரநிலைகளுடன் செயல்படும் நம்பகமான உற்பத்தியாளர்.",
      },
    },

    wholesale: {
      title: "மொத்தமாக வாங்க விரும்புகிறீர்களா?",
      description:
        "வணிக நிறுவனங்கள் மற்றும் குடும்பத் தேவைகளுக்காக உயர்தர செக்கு எண்ணெய்களை மொத்த விலையில் வழங்குகிறோம்.",
      requestQuote: "மொத்த விலை விவரங்களைப் பெறுங்கள்",
    },
  },
} as const;

export type Language = keyof typeof translations;
export type TranslationKey = typeof translations.en;