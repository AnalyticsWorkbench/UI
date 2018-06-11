import compose from 'lodash/function/compose';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';

import * as workflowActionsRaw from 'actions/workflow';

const selector = createSelector(
	state => state.workflow.drawerTab,
	state => state.workflow.drawerModuleId,
	state => state.workflow.executing,
	(drawerTab, drawerModuleId, executing) => {
		return {
			drawerTab, drawerModuleId, executing
		};
	}
);

const connectFn = connect(
	selector,
	dispatch => ({
        workflowActions: bindActionCreators(workflowActionsRaw, dispatch),
    })
);

export default function enhance(Component) {
	return compose(connectFn)(Component);
}
