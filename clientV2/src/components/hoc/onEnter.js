import React, { PropTypes, createClass } from 'react';

const storeShape = PropTypes.shape({
    subscribe: PropTypes.func.isRequired,
    dispatch: PropTypes.func.isRequired,
    getState: PropTypes.func.isRequired
});

export default function onEnter(fn) {
	return DecoratedComponent => createClass({

        displayName: 'OnEnter',

		contextTypes: {
			store: storeShape.isRequired
		},

		componentWillMount() {
			this.invoke();
		},

		invoke() {
            const props = this.props;
			const dispatch = this.context.store.dispatch;
			const getState = this.context.store.getState;
			fn({ props, getState, dispatch });
		},

		render() {
			return (
				<DecoratedComponent {...this.props} />
			);
		}
	});
}
