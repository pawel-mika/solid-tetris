/* @refresh reload */
import { render } from 'solid-js/web';

import './index.css';
import TetrisPage from './TetrisPage';

console.log(import.meta.env);

render(() => <TetrisPage />, document.getElementById('root') as HTMLElement);
