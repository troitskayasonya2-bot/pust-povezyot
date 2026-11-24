import { sound } from '../play/screen.js?v=10';

addEventListener('raffle:entered', () => sound.play('win'));
