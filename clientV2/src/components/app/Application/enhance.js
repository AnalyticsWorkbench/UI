import compose from 'lodash/function/compose';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';

import * as workflowActions from 'actions/workflow';
import showLoader from 'components/hoc/showLoader';
import onEnter from 'components/hoc/onEnter';
import { fetch as fetchFilters } from 'actions/filters';
import { fetch as fetchWorkflows } from 'actions/workflow';

const onEnterFn = onEnter(({ dispatch }) => {
	dispatch(fetchFilters());
	dispatch(fetchWorkflows());
});

const selector = createSelector(
	state => state.filters.fetching,
	state => state.filters.byId,
	state => state.workflow.fetching,
	state => state.workflow.modulesById,
	state => state.workflow.wiresById,
	(filtersFetching, filtersById, workflowsFetching, modulesById, wiresById) => ({
		loading: filtersFetching || workflowsFetching,
		filtersById,
		modulesById,
		wiresById
	})
);

const connectFn = connect(
	selector,
    dispatch => ({
        workflowActions: bindActionCreators(workflowActions, dispatch),
    })
);

const showLoaderFn = showLoader(({ loading }) => loading);

export default function enhance(Component) {
	return compose(onEnterFn, connectFn, showLoaderFn)(Component);
}
