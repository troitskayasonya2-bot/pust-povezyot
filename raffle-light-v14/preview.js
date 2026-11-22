const entry = document.querySelector('#entry');
const email = document.querySelector('#email');
const helper = document.querySelector('#entry-helper');

const params = new URLSearchParams(location.search);
const openRaffle = params.get('state') === 'open';

if (openRaffle) {
  const home = document.querySelector('.footer a');
  const start = new URL(home.href);
  start.searchParams.set('state', 'open');
  home.href = start.href;
  document.title = 'Розыгрыш подарков · Пусть повезёт';
  document.querySelector('#title-end').textContent = 'подарков';
  document.querySelector('#intro').hidden = false;
  document.querySelector('#winners').hidden = true;
  document.querySelector('#restart').hidden = true;
  entry.hidden = false;
}

entry.addEventListener('submit', event => {
  event.preventDefault();
  email.value = '';
  helper.textContent = 'Это превью. Заявка не\u00a0отправлена.';
  dispatchEvent(new Event('raffle:entered'));
});
