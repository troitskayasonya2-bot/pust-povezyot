import { sound } from '../play/screen.js?v=7';

addEventListener('raffle:entered', () => sound.play('win'));
