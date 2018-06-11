// import 'babel-polyfill';
import React from 'react';
import { render } from 'react-dom';
import Root from 'components/app/Root';
import * as reducers from './reducers';

render(
    <Root reducers={reducers}/>,
    document.getElementById('root')
);
