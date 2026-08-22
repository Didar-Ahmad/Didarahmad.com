(function () {
  const storeKey = 'auramax-30-day-transformation-progress';
  const days = [
    ['Reset', 'Set your baseline', 'Choose one realistic intention for the month. Take a private daylight reference only if it helps you notice progress—not to judge yourself.'],
    ['Reset', 'Build a simple kit', 'Set out the essentials you already use: cleanser, moisturiser, sunscreen when exposed, toothbrush, deodorant, nail care and a clean towel.'],
    ['Reset', 'Anchor your sleep', 'Choose a consistent wind-down time and aim for enough sleep to feel rested. Keep this practical; no extreme rules.'],
    ['Reset', 'Hydration and meals', 'Plan regular meals and keep water available through the day. Focus on energy and recovery, not restrictive dieting.'],
    ['Grooming', 'Create a five-minute morning routine', 'Cleanse as needed, moisturise, apply sunscreen when exposed, style hair simply and choose clean clothes.'],
    ['Grooming', 'Refresh hair care', 'Choose a wash and styling rhythm that suits your hair texture. Save one reference for your next haircut.'],
    ['Reset', 'Weekly review', 'Tick what felt easy, remove what did not, and choose one small improvement for next week.'],
    ['Posture', 'Set a posture cue', 'Place your screen at a comfortable height, relax your shoulders and take a brief standing break during long sitting periods.'],
    ['Fitness', 'Take a comfortable walk', 'Move at a pace that feels good for you. Consistency is more valuable than intensity.'],
    ['Grooming', 'Tidy hands and nails', 'Trim or file nails, moisturise hands and clean the small details that make everyday presentation feel intentional.'],
    ['Fitness', 'Try a foundation session', 'Do a beginner-friendly strength or mobility session using safe technique. If you are unsure, follow qualified guidance.'],
    ['Posture', 'Open your upper body', 'Spend a few minutes on gentle chest, upper-back and hip mobility. Stop if you feel pain.'],
    ['Wellbeing', 'Check your energy', 'Notice sleep, stress and food patterns. Adjust your plan to support your wellbeing rather than chasing a look.'],
    ['Reset', 'Weekly review', 'Celebrate what you repeated this week. Keep the next seven days simple and achievable.'],
    ['Wardrobe', 'Do a fit audit', 'Try on a few regular outfits. Keep the pieces that fit comfortably today and set aside what needs tailoring, repair or donation.'],
    ['Wardrobe', 'Choose your core colours', 'Use your personal style plan to select two neutrals and one or two accent colours you genuinely enjoy wearing.'],
    ['Wardrobe', 'Build one reliable outfit', 'Create an easy formula for everyday use: a clean top, well-fitting bottom, comfortable footwear and one optional layer.'],
    ['Wardrobe', 'Build a smarter outfit', 'Create a polished option for meetings, dates or events using fit, fabric and clean shoes rather than expensive labels.'],
    ['Wardrobe', 'Care for footwear', 'Clean the pair you wear most, check comfort and decide which shoe gap would make your wardrobe easier.'],
    ['Wardrobe', 'Edit accessories', 'Keep only the accessories that feel natural: a watch, simple belt, bag or eyewear. Less is often easier to repeat.'],
    ['Wardrobe', 'Capture your formulas', 'Save photos or notes for two outfits that made you feel comfortable and put together.'],
    ['Confidence', 'Practise presence', 'Use an open, relaxed stance and a natural pace when you walk. Focus on how you feel, not on performing.'],
    ['Fitness', 'Schedule your movement', 'Put two or three realistic movement sessions in the coming week. Protect recovery and choose activities you can enjoy.'],
    ['Grooming', 'Set a ten-minute reset', 'Create a short evening reset: prepare clothes, basic hygiene, tidy your space and set out tomorrow’s essentials.'],
    ['Wardrobe', 'Create a mini capsule', 'Pick five to eight pieces that combine easily for the week. Make getting dressed easier on busy mornings.'],
    ['Confidence', 'Use a social comfort challenge', 'Choose one low-pressure action: say hello, make eye contact, ask a question or attend something you enjoy.'],
    ['Grooming', 'Refine, do not restart', 'Keep the routines that worked. Change only one product, haircut detail or style choice at a time.'],
    ['Wardrobe', 'Plan one week of outfits', 'Prepare a simple line-up using your best formulas. Include a comfortable backup option.'],
    ['Reset', 'Write your personal standard', 'Write three habits you want to keep: one grooming habit, one movement habit and one wardrobe habit.'],
    ['Reset', 'Build your next 30 days', 'Review your progress, keep what serves you and begin another month with a lighter, sustainable routine.']
  ].map(([theme, title, task], index) => ({ day: index + 1, theme, title, task }));

  const normalise = value => Array.from(new Set((Array.isArray(value) ? value : []).map(Number).filter(day => Number.isInteger(day) && day >= 1 && day <= days.length))).sort((a, b) => a - b);
  const load = () => {
    try {
      const data = JSON.parse(localStorage.getItem(storeKey) || '{}');
      return { completedDays: normalise(data.completedDays), startedAt: data.startedAt || null, updatedAt: data.updatedAt || null };
    } catch (_) { return { completedDays: [], startedAt: null, updatedAt: null }; }
  };
  const save = progress => {
    const next = { completedDays: normalise(progress.completedDays), startedAt: progress.startedAt || new Date().toISOString(), updatedAt: new Date().toISOString() };
    localStorage.setItem(storeKey, JSON.stringify(next));
    return next;
  };
  const toggle = day => {
    const progress = load();
    const set = new Set(progress.completedDays);
    set.has(day) ? set.delete(day) : set.add(day);
    return save({ ...progress, completedDays: [...set] });
  };
  const merge = progress => save({ ...load(), ...progress, completedDays: normalise(progress?.completedDays) });
  const percentage = progress => Math.round((normalise(progress?.completedDays).length / days.length) * 100);

  window.AuraMaxTransformationPlan = { days, load, save, toggle, merge, percentage };
})();
