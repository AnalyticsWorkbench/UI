import find from 'lodash/collection/find';
import compose from 'lodash/function/compose';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';

import getMetaData from 'utils/getMetaData';
import isInputModule from 'utils/isInputModule';
import isOutputModule from 'utils/isOutputModule';
import * as workflowActionsRaw from 'actions/workflow';

const selector = createSelector(
	(state, { module }) => module,
	state => state.workflow.modulesById,
	state => state.workflow.wiresById,
	state => state.workflow.drawerTab,
	state => state.workflow.drawerModuleId,
	state => state.workflow.agentsByModuleId,
	state => state.workflow.metaDataByModuleId,
	state => state.workflow.metaWorkflowByRunid,
	state => state.filters.byId,
	(module, modulesById, wiresById, drawerTab, drawerModuleId, agentsByModuleId, metaDataByModuleId, metaWorkflowByRunid, filtersById) => {
		const { id, filterId } = module;
		const filter = filtersById[filterId];
		const drawerOpen = drawerTab === 'detail';
		const selected = id === drawerModuleId && drawerOpen;
		const lowlight = drawerModuleId !== undefined && drawerOpen && !selected;
		const agent = agentsByModuleId[id];
		const status = agent && agent.status || 0;
		const isInput = isInputModule(module, filtersById);
		const isOutput = isOutputModule(module, filtersById);
		const meta = metaDataByModuleId[id];
		const metaInput = getMetaData(id, modulesById, wiresById, filtersById, metaDataByModuleId);
		let metaStatus;

		if (isInput) {
			const metaWorkflow = find(metaWorkflowByRunid, workflow => workflow.moduleId === id);
			if (metaWorkflow) metaStatus = metaWorkflow.status;
		}

		return {
			meta,
			metaStatus,
			metaInput,
			isInputModule: isInput,
			isOutputModule: isOutput,
			filter,
			status,
			selected,
			lowlight
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
