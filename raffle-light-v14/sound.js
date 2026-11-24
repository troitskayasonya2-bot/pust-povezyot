import { sound } from '../play/screen.js?v=9';

addEventListener('raffle:entered', () => sound.play('win'));
