(function () {
  const STORE_KEY = 'auramax-personal-style-plan';

  const skinProfiles = {
    'fair-light': {
      label: 'Fair / light',
      colours: ['Navy', 'Forest green', 'Burgundy', 'Stone', 'Soft blue'],
      avoid: ['Very pale beige close to your skin tone', 'Neon shades near the face'],
    },
    'medium-wheatish': {
      label: 'Medium / wheatish',
      colours: ['Olive', 'Teal', 'Cream', 'Rust', 'Deep blue'],
      avoid: ['Washed-out grey-beige', 'Very fluorescent yellow'],
    },
    olive: {
      label: 'Olive',
      colours: ['Ecru', 'Chocolate', 'Cobalt', 'Sage', 'Terracotta'],
      avoid: ['Muted yellow-green close to your undertone', 'Dusty brown from head to toe'],
    },
    'deep-dark': {
      label: 'Deep / dark',
      colours: ['Crisp white', 'Cobalt', 'Emerald', 'Camel', 'Wine'],
      avoid: ['Ashy taupe close to your skin tone', 'Very low-contrast beige layers'],
    },
  };

  const facePriorities = {
    round: ['Keep side volume controlled and add modest height at the crown', 'Choose softly structured eyewear and collars with open vertical lines'],
    square: ['Keep facial hair edges clean but not overly sharp', 'Use softer collar and hairstyle texture to balance strong angles'],
    heart: ['Keep the lower face balanced with light, natural facial-hair structure if you wear it', 'Choose medium-width frames rather than very top-heavy styles'],
    oblong: ['Avoid excessive height in the hairstyle; aim for balanced sides', 'Use horizontal detail in collars, knitwear or eyewear when it suits you'],
    oval: ['Maintain a clean haircut shape and keep proportions balanced', 'Use simple grooming consistency instead of chasing dramatic changes'],
    default: ['Choose a haircut that keeps your face proportions balanced', 'Keep brows, skin and facial hair tidy before changing anything major'],
  };

  const bodyFormulas = {
    rectangle: ['Structured overshirt + fitted tee + straight trousers', 'Polo or knit + pleated trousers + clean low-profile shoes'],
    'inverted-triangle': ['Relaxed shirt + straight trousers to balance the frame', 'Fine-gauge knit + tapered trousers; avoid piling volume on the shoulders'],
    triangle: ['Darker trousers + a structured overshirt or jacket', 'Open-collar shirt + straight leg trousers for a cleaner vertical line'],
    oval: ['Open overshirt + tonal tee + straight trousers', 'Lightweight knit or polo + mid-rise trousers with a neat break'],
    athletic: ['Fitted tee or polo + straight trousers', 'Camp-collar shirt + tailored shorts or relaxed trousers'],
    default: ['One fitted base layer + one relaxed outer layer + straight trousers', 'Tonal shirt + neutral trousers + one intentional accent'],
  };

  function keyFor(value) {
    return String(value || '').trim().toLowerCase().replace(/[^a-z]+/g, '-').replace(/(^-|-$)/g, '');
  }

  function build(profile) {
    const skinKey = keyFor(profile.skinTone || profile.skin || 'medium-wheatish');
    const skin = skinProfiles[skinKey] || skinProfiles['medium-wheatish'];
    const faceKey = keyFor(profile.face || '');
    const face = facePriorities[faceKey] || facePriorities.default;
    const bodyKey = keyFor(profile.body || '');
    const formulas = bodyFormulas[bodyKey] || bodyFormulas.default;

    return {
      version: 1,
      profile: {
        face: profile.face || 'Not selected',
        body: profile.body || 'Not selected',
        skinTone: skin.label,
      },
      recommendedColours: skin.colours,
      outfitFormulas: formulas,
      groomingPriorities: [...face, 'Build a simple daily baseline: cleanse, moisturize, SPF, tidy nails and fresh breath.'],
      avoids: [...skin.avoid, 'Buying multiple statement pieces before you have reliable neutral basics.'],
      updatedAt: new Date().toISOString(),
    };
  }

  function load() {
    try {
      return JSON.parse(localStorage.getItem(STORE_KEY) || 'null');
    } catch {
      return null;
    }
  }

  function save(plan) {
    localStorage.setItem(STORE_KEY, JSON.stringify(plan));
    return plan;
  }

  function createAndSave(profile, force) {
    const existing = load();
    const nextProfile = build(profile).profile;
    if (!force && existing && JSON.stringify(existing.profile) === JSON.stringify(nextProfile)) return existing;
    return save(build(profile));
  }

  window.AuraMaxStylePlan = { build, load, save, createAndSave, skinProfiles };
})();
