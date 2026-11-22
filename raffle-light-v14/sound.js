import { sound } from '../play/screen.js?v=1';

addEventListener('raffle:entered', () => sound.play('win'));
