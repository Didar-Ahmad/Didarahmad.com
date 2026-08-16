(() => {
  const root = document.querySelector('#view-root');
  if (!root) return;

  const goToCategories = () => document.querySelector('nav [data-view="hub"]')?.click();

  const enhance = () => {
    const eyebrow = root.querySelector('.view-head .eyebrow')?.textContent?.trim();
    const existingBack = root.querySelector(':scope > .back');

    if (eyebrow === 'LOOKSMAX COMPLETE GUIDE' || eyebrow === 'STYLING GUIDE') {
      if (!existingBack) {
        const back = document.createElement('button');
        back.className = 'text-link back';
        back.textContent = '← Back to categories';
        back.addEventListener('click', goToCategories);
        root.prepend(back);
      }
    }

    const chapterBack = root.querySelector(':scope > .back');
    if (eyebrow?.startsWith('CHAPTER') && chapterBack) {
      chapterBack.textContent = '← Back to complete guide';
    }

    const readerBack = root.querySelector('.reader > .back');
    if (readerBack && !readerBack.textContent.includes('Back to')) {
      readerBack.textContent = `← Back to ${readerBack.textContent.replace('←', '').trim()} chapter`;
    }
  };

  new MutationObserver(enhance).observe(root, { childList: true, subtree: true });
  enhance();
})();
