import { compose, createStore, applyMiddleware, combineReducers } from 'redux';
import createSocket from '../socket/createSocket';
import createRequester from '../socket/createRequester';

import receive from './enhancers/receive';
import meta from './enhancers/meta';
import actionEventMap from './actionEventMap';

import thunk from './middleware/thunk';
import promise from './middleware/promise';
import evaluateFilters from './middleware/evaluateFilters';
import logger from './middleware/logger';

export default function finalCreateStore(reducers, initialState) {
	const socket = createSocket();
	const request = createRequester(socket);
	const receiver = receive(socket, actionEventMap);

	// Middleware
	const middleware = applyMiddleware(
		thunk({ request }),
		promise,
		evaluateFilters,
		logger
	);

	// Enhancers
	const createEnhancedStore = compose(
		meta,
		receiver,
		middleware
	);

	const reducer = combineReducers(reducers);
	return createEnhancedStore(createStore)(reducer, initialState);
}
