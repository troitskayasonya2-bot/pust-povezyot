// Colours connect the capsule in the tray to the one that opens.
const capsules = {
  coral: { capsule: 'assets/closed-capsule.svg', shell: 'assets/open-capsule.svg' },
  yellow: { capsule: 'assets/closed-capsule-bounce.svg', shell: 'assets/bounce-shell.svg' },
  mint: { capsule: 'assets/closed-capsule-note.svg', shell: 'assets/note-shell.svg' },
};

const toys = {
  water: { color: 'yellow', art: 'assets/water-result.svg', alt: 'Водяная игра с колечками в открытой капсуле' },
  car: { color: 'mint', art: 'assets/car-result.svg', alt: 'Красная машинка в открытой капсуле' },
  frog: { color: 'coral', art: 'assets/frog-result.svg', alt: 'Лягушка-прыгун в открытой капсуле' },
  yoyo: { color: 'coral', art: 'assets/yoyo-result.svg', alt: 'Йо-йо со звездой в открытой капсуле' },
  hand: { color: 'yellow', art: 'assets/hand-result.svg', alt: 'Липкая ладошка в открытой капсуле' },
  teeth: { color: 'yellow', art: 'assets/teeth-result.svg', alt: 'Заводная челюсть в открытой капсуле' },
  light: { color: 'mint', art: 'assets/light-result.svg', alt: 'Фонарик-брелок в открытой капсуле' },
  top: { color: 'mint', art: 'assets/top-result.svg', alt: 'Полосатый волчок в открытой капсуле' },
  maze: { color: 'coral', art: 'assets/maze-result.svg', alt: 'Лабиринт с шариком в открытой капсуле' },
  bounce: { color: 'yellow', art: 'assets/bounce-result.svg?v=2', alt: 'Разноцветный попрыгунчик в открытой капсуле' },
  note: { color: 'mint', art: 'assets/note-result.svg?v=2', alt: 'Сложенная бумажка в открытой капсуле' },
  ring: { color: 'coral', art: 'assets/ring.svg?v=3', alt: 'Кольцо с красным камнем в открытой капсуле' },
};

// [id, toy, title, text]. Keep the id 'ring': its desktop card has the text drawn in SVG.
const cards = [
  ['water', 'water', 'Море по колечко',
    'На море пока не вырвешься. Но побулькать побулькаешь.'],
  ['water-2', 'water', 'Всё включено',
    'И водичка тебе, и колечки. А ты говоришь, Турция.'],
  ['car', 'car', 'Тачка мечты',
    'Всё как просили. Про размер в желании ничего не было.'],
  ['car-2', 'car', 'Повезёт, но недалеко',
    'До края стола. Зато таксист не будет рассказывать про жизнь.'],
  ['frog', 'frog', 'Жаба задушит',
    'Захочешь кроссовки за двадцать тысяч, а она не разрешит.'],
  ['frog-2', 'frog', 'Царевич так себе',
    'Целовать, конечно, можно. Но мы бы не стали.'],
  ['yoyo', 'yoyo', 'Йо-йо-моё',
    'Опять напишет бывший. Или бывшая. Короче, не отвечай.'],
  ['yoyo-2', 'yoyo', 'Туда-сюда',
    'Скажешь «ну всё, я домой» и ещё час простоишь в прихожей.'],
  ['hand', 'hand', 'Ручки загребущие',
    'Скажешь «я только попробую» и съешь чужую картошку.'],
  ['hand-2', 'hand', 'Дай пять',
    'Тысяч до зарплаты, а? В пятницу всё верну.'],
  ['teeth', 'teeth', 'Зуб даю',
    'С понедельника начнёшь новую жизнь. Ну или со следующего.'],
  ['teeth-2', 'teeth', 'Улыбочку',
    'Тётя опять спросит, когда свадьба. Улыбаемся и машем.'],
  ['light', 'light', 'Тебе светит',
    'Отпуск в августе, если Лена из бухгалтерии не успела раньше.'],
  ['light-2', 'light', 'Ни свет ни заря',
    'В субботу проснёшься в семь утра. Вот зачем, спрашивается?'],
  ['top', 'top', 'Серенький волчок',
    'Укусит за бочок. А мама говорила не ложиться с краю.'],
  ['top-2', 'top', 'Голова кругом',
    'Это любовь. Но давление на всякий случай померь.'],
  ['maze', 'maze', 'Уже выхожу',
    'Напишешь это, лёжа на кровати в одном полотенце.'],
  ['maze-2', 'maze', 'Потеряшка',
    'Придёшь на кухню и забудешь зачем. Ну хоть поешь.'],
  ['bounce', 'bounce', 'Попрыгунья',
    'Лето красное пропоёшь. И правильно, работа подождёт.'],
  ['bounce-2', 'bounce', 'Укатишься',
    'Со смеху, прямо на созвоне. Камеру выключить не успеешь.'],
  ['note', 'note', 'Освобождение от физры',
    'И от всех дел до понедельника. Подпись: мама.'],
  ['note-2', 'note', 'Так и запишем',
    'Всё у тебя будет хорошо. Печати нет, но ты верь.'],
  ['ring', 'ring', 'Тебе сделают предложение.',
    'Заказать пиццу и никуда не идти.'],
  ['ring-2', 'ring', 'Окольцуют',
    'Правда, на входе в аквапарк. Но всё равно приятно.'],
];

// Short words stay with the next word, particles with the previous one,
// and the last word of a paragraph never stands alone.
const shortWord = /(^|[\s«])(а|без|в|во|до|за|и|из|к|ко|на|не|но|о|об|от|по|под|с|со|у|что|чем|про|над|при|через|ни|ну|если|это) /gi;
function tie(value) {
  const glue = (match, before, word) => `${before}${word}\u00a0`;
  return value.replace(shortWord, glue).replace(shortWord, glue)
    .replace(/ (же|бы|ли)(?=[\s,.!?]|$)/g, '\u00a0$1');
}
function tieParagraph(value) {
  return tie(value).replace(/ ([^ ]+)$/, '\u00a0$1');
}

const outcomes = Object.fromEntries(cards.map(([id, toy, title, text]) => [id, {
  id,
  toy,
  ...toys[toy],
  ...capsules[toys[toy].color],
  title: tie(title),
  text: tieParagraph(text),
}]));

export const outcomeIds = Object.keys(outcomes);
const storageKey = 'pust-povezyot-outcomes-v2';
const isOutcome = id => Object.hasOwn(outcomes, id);

export function getOutcome(id) {
  return isOutcome(id) ? outcomes[id] : outcomes.ring;
}

// A colour may be next only if the rest of the deck can still alternate.
function canAlternate(id, pool) {
  const counts = {};
  for (const item of pool) {
    if (item === id) continue;
    const { color } = outcomes[item];
    counts[color] = (counts[color] ?? 0) + 1;
  }
  const left = pool.length - 1;
  return Object.entries(counts).every(([color, count]) =>
    count <= (color === outcomes[id].color ? Math.floor(left / 2) : Math.ceil(left / 2)));
}

export function drawOutcome(after) {
  let saved;
  try {
    saved = JSON.parse(sessionStorage.getItem(storageKey));
  } catch {
    // Keep drawing randomly even when session storage is unavailable.
  }

  const recent = Array.isArray(saved?.recent) ? saved.recent.filter(isOutcome) : [];
  if (isOutcome(after) && recent.at(-1) !== after) recent.push(after);
  const last = recent.at(-1);

  let pool = Array.isArray(saved?.remaining)
    ? [...new Set(saved.remaining.filter(id => isOutcome(id) && id !== last))]
    : outcomeIds.filter(id => id !== last);
  if (!pool.length) pool = [...outcomeIds];

  const otherColour = pool.filter(id => !last || outcomes[id].color !== outcomes[last].color);
  const balanced = otherColour.filter(id => canAlternate(id, pool));
  let choices = balanced.length ? balanced : otherColour;
  // Only an externally opened prediction can leave a deck without another colour.
  if (!choices.length) {
    pool = [...outcomeIds];
    choices = pool.filter(id => outcomes[id].color !== outcomes[last].color);
  }
  const recentToys = new Set(recent.slice(-3).map(id => outcomes[id].toy));
  const freshToys = choices.filter(id => !recentToys.has(outcomes[id].toy));
  if (freshToys.length) choices = freshToys;

  const id = choices[Math.floor(Math.random() * choices.length)];
  return {
    outcome: getOutcome(id),
    deck: { recent: [...recent, id].slice(-3), remaining: pool.filter(item => item !== id) },
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
