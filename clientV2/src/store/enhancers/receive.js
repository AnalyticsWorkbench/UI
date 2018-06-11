import each from 'lodash/collection/each';

export default function receive(socket, actionEventMap) {
	return createStore => (reducer, initialState) => {
		const store = createStore(reducer, initialState);
        each(actionEventMap, (action, event) => {
            const handler = (...args) => store.dispatch(action(...args));
            socket.on(event, handler);
        });
		return store;
	};
}
