import compose from 'lodash/function/compose';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';

const selector = createSelector(
	(state, { module }) => module,
	state => state.filters.byId,
	(module, filtersById) => {
        const { filterId } = module;
        const filter = filtersById[filterId];
		return {
			module,
            filter
		};
	}
);

const connectFn = connect(selector);

export default function enhance(Component) {
	return compose(connectFn)(Component);
}
