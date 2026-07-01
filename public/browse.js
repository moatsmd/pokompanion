// Shared client-side filter for the browse/index pages.
// Markup contract: #q (search input), #cat (select), #count, optional #noresults,
// and #list holding .card elements with data-name + data-cat. #list carries
// data-noun (+ optional data-noun-plural); add data-multi when data-cat holds
// several space-separated values (e.g. a Pokémon appearing in multiple biomes).
(() => {
  const q = document.getElementById('q');
  const cat = document.getElementById('cat');
  const list = document.getElementById('list');
  if (!q || !cat || !list) return;
  const cards = [...list.querySelectorAll('.card')];
  const count = document.getElementById('count');
  const none = document.getElementById('noresults');
  const noun = list.dataset.noun || 'result';
  const plural = list.dataset.nounPlural || noun + 's';
  const multi = 'multi' in list.dataset;
  const apply = () => {
    const term = q.value.trim().toLowerCase();
    const c = cat.value;
    let shown = 0;
    for (const el of cards) {
      const catOk = !c || (multi ? el.dataset.cat.split(' ').includes(c) : el.dataset.cat === c);
      const ok = (!term || el.dataset.name.includes(term)) && catOk;
      el.hidden = !ok;
      if (ok) shown++;
    }
    if (count) count.textContent = shown + ' ' + (shown === 1 ? noun : plural);
    if (none) none.hidden = shown !== 0;
  };
  q.addEventListener('input', apply);
  cat.addEventListener('change', apply);
})();
