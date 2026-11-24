import { sound } from '../play/screen.js?v=12';

addEventListener('raffle:entered', () => sound.play('win'));
