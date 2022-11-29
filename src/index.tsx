/* @refresh reload */
import { render } from 'solid-js/web';

import './index.css';
import TetrisPage from './TetrisPage';

render(() => <TetrisPage />, document.getElementById('root') as HTMLElement);
