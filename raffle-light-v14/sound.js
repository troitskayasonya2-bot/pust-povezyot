import { sound } from '../play/screen.js?v=3';

addEventListener('raffle:entered', () => sound.play('win'));
