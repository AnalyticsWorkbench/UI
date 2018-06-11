import sortBy from 'lodash/collection/sortBy';
import each from 'lodash/collection/each';
import compose from 'lodash/function/compose';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';

import createFilterIdFromName from 'utils/createFilterIdFromName';
import * as workflowActionsRaw from 'actions/workflow';

const ignoreFilters = ['Meta Analysis'];

const selector = createSelector(
	state => state.filters.byId,
	(filtersById) => {
		const filtersByCategory = {};
		const categories = [];

		each(filtersById, filter => {
			const { category, name } = filter;
			if (ignoreFilters.indexOf(name) > -1) return;
			const categoryId = createFilterIdFromName(category);
			if (!filtersByCategory[categoryId]) {
				categories.push({ id: categoryId, label: category });
				filtersByCategory[categoryId] = [filter];
			} else {
				filtersByCategory[categoryId].push(filter);
			}
		}, {});

		const sortedCategories = sortBy(categories, 'label');

		each(filtersByCategory, (filterCategories, key) => {
			filtersByCategory[key] = sortBy(filterCategories, 'name');
		});

		return {
            categories: sortedCategories,
			filtersByCategory
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
