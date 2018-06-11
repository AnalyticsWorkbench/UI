import React, { createClass, PropTypes } from 'react';
import { Provider } from 'react-redux';

import Application from '../Application';
import createStore from 'store/createStore';
import 'styles/scaffholding/index.scss';

export default createClass({

    displayName: 'Root',

    propTypes: {
		reducers: PropTypes.object.isRequired
	},

    componentWillMount() {
        const { reducers } = this.props;
        this.store = createStore(reducers);
    },

    render() {
        const { store } = this;
		return (
			<Provider store={store}>
                <Application/>
            </Provider>
        );
    }
});
