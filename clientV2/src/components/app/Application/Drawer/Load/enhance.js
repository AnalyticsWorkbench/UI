import sortBy from 'lodash/collection/sortBy';
import compose from 'lodash/function/compose';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import parseCustomDate from 'utils/parseCustomDate';

import * as workflowActions from 'actions/workflow';


const selector = createSelector(
	state => state.workflow.workflowsBySaveId,
	(workflowsBySaveId) => {
		const now = new Date();
		const workflows = sortBy(workflowsBySaveId, ({ date }) => {
			return now - parseCustomDate(date);
		});
		return { workflows };
	}
);

const connectFn = connect(
	selector,
	dispatch => ({
        workflowActions: bindActionCreators(workflowActions, dispatch),
    })
);

export default function enhance(Component) {
	return compose(connectFn)(Component);
}
