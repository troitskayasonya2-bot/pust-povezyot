import { sound } from '../play/screen.js?v=11';

addEventListener('raffle:entered', () => sound.play('win'));
