import reduce from 'lodash/collection/reduce';
import compose from 'lodash/function/compose';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';

import isInputModule from 'utils/isInputModule';
import isOutputModule from 'utils/isOutputModule';
import getFieldValidationMessage from 'utils/getFieldValidationMessage';
import getMetaData from 'utils/getMetaData';
import * as workflowActionsRaw from 'actions/workflow';

function getForm(module, filter, meta) {
	const { value } = module;
	const { container } = filter;
	const { form, js_update_form } = container;
	if (!meta || !js_update_form) return form;

	try {
		const result = js_update_form(form, value, meta);
		return result;
	} catch (err) {
		console.error('Error while invoking js_update_form', err);
		return form;
	}
}


const selector = createSelector(
	(state, props) => props.moduleId,
	state => state.workflow.modulesById,
	state => state.workflow.wiresById,
	state => state.workflow.metaDataByModuleId,
	state => state.filters.byId,
	(moduleId, modulesById, wiresById, metaDataByModuleId, filtersById) => {
        const module = modulesById[moduleId];
		if (!module) return { empty: true };
		const { filterId } = module;
		const filter = filtersById[filterId];

		const isInput = isInputModule(module, filtersById);
		const isOutput = isOutputModule(module, filtersById);
		const meta = metaDataByModuleId[moduleId];
		const metaInput = getMetaData(moduleId, modulesById, wiresById, filtersById, metaDataByModuleId);
		/**
		 * here we get the Metadata into meta data tabs according to moduleId and filterbyid
		 * @type {*|*|*}
		 */
		const form = getForm(module, filter, metaInput);
		const { value } = module;
		const messages = reduce(form, (acc, field, id) => {
            const val = value[id];
			const message = getFieldValidationMessage(field, val);
			if (message) acc[id] = message;
            return acc;
        }, {});

		return {
            module,
			filter,
			form,
			messages,
			isInput,
			isOutput,
			meta,
			metaInput
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
