import { sound } from '../play/screen.js?v=8';

addEventListener('raffle:entered', () => sound.play('win'));
