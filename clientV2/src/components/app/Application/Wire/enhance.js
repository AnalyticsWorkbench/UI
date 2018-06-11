import compose from 'lodash/function/compose';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';

const selector = createSelector(
	(state, { wire }) => wire,
	state => state.workflow.selectedModuleId,
	state => state.workflow.modulesById,
	state => state.filters.byId,
	(wire, selectedModuleId, modulesById, filtersById) => {
		const { src, tgt } = wire;
		const { moduleId: moduleFromId } = src;
		const { moduleId: moduleToId } = tgt;

		let moduleFrom;
		let moduleTo;
		let filterFrom;
		let filterTo;

		if (moduleFromId !== undefined) {
			moduleFrom = modulesById[moduleFromId];
			const filterFromId = moduleFrom.filterId;
			filterFrom = filtersById[filterFromId];
		}
		if (moduleToId !== undefined) {
			moduleTo = modulesById[moduleToId];
			const filterToId = moduleTo.filterId;
			filterTo = filtersById[filterToId];
		}

		const lowlight = selectedModuleId !== undefined
			&& selectedModuleId !== moduleFromId
			&& selectedModuleId !== moduleToId;

		return {
			moduleFrom,
			moduleTo,
			filterFrom,
			filterTo,
			lowlight
		};
	}
);

const connectFn = connect(selector);

export default function enhance(Component) {
	return compose(connectFn)(Component);
}
