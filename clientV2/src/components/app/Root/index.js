import React, { createClass, PropTypes } from 'react';
import { Provider } from 'react-redux';
import { applyMiddleware} from 'redux';
import Application from '../Application';
import createStore from 'store/createStore';
import 'styles/scaffholding/index.scss';
import thunk from 'redux-thunk';

export default createClass({

    displayName: 'Root',

    propTypes: {
		reducers: PropTypes.object.isRequired
	},

    componentWillMount() {
        const { reducers } = this.props;
        this.store = createStore(reducers, window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__(),
            applyMiddleware(thunk));
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
