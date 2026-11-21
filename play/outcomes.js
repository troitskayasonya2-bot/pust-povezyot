const outcomes = {
  ring: {
    id: 'ring',
    art: 'assets/ring.svg',
    alt: 'Кольцо с красным камнем в открытой капсуле',
    title: 'Тебе сделают предложение.',
    text: 'Заказать пиццу и никуда не идти.',
  },
  bounce: {
    id: 'bounce',
    art: 'assets/bounce-result.svg',
    alt: 'Разноцветный попрыгунчик в открытой капсуле',
    title: 'Со второго раза',
    text: 'То, что не получилось с первого раза, получится со второго.',
  },
  note: {
    id: 'note',
    art: 'assets/note-result.svg',
    alt: 'Сложенная бумажка в открытой капсуле',
    title: 'Хорошие новости',
    text: 'Придут оттуда, откуда ты их не ждёшь.',
  },
};

const outcomeIds = Object.keys(outcomes);
const storageKey = 'pust-povezyot-outcomes';

export function getOutcome(id) {
  return Object.hasOwn(outcomes, id) ? outcomes[id] : outcomes.ring;
}

export function drawOutcome(after) {
  const previous = Object.hasOwn(outcomes, after) ? after : null;
  let saved;
  try {
    saved = JSON.parse(sessionStorage.getItem(storageKey));
  } catch {
    if (previous) {
      const next = outcomeIds[(outcomeIds.indexOf(previous) + 1) % outcomeIds.length];
      return { outcome: getOutcome(next) };
    }
  }

  const remaining = Array.isArray(saved?.remaining)
    ? [...new Set(saved.remaining.filter(id => id !== saved.last && Object.hasOwn(outcomes, id)))]
    : [];
  const fromPreview = previous && previous !== saved?.last;
  const pool = fromPreview ? outcomeIds.filter(id => id !== previous) : (remaining.length ? remaining : outcomeIds);
  const last = previous ?? saved?.last;
  const choices = pool.filter(id => id !== last);
  const id = choices[Math.floor(Math.random() * choices.length)];
  return {
    outcome: getOutcome(id),
    deck: { last: id, remaining: pool.filter(item => item !== id) },
  };
}

export function saveOutcome({ deck }) {
  if (!deck) return;
  try {
    sessionStorage.setItem(storageKey, JSON.stringify(deck));
  } catch {
    // Replay still knows the last result from its link.
  }
}
