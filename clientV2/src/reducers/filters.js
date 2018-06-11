import reduce from 'lodash/collection/reduce';
import createFilterIdFromName from 'utils/createFilterIdFromName';
import directUploaderConfiguration from 'utils/directUploaderConfiguration';

const initialState = {
	byId: {},
    fetching: false,
    fetchingError: undefined
};

function indexTerminalTypes(terminals, type) {
	return reduce(terminals, (acc, terminal) => {
		const { name } = terminal;
		acc[name] = { ...terminal, type };
		return acc;
	}, {});
}

function indexTerminalsById(filter) {
	const { container } = filter;
	const { inputs, outputs } = container;
	return {
		...indexTerminalTypes(inputs, 'in'),
		...indexTerminalTypes(outputs, 'out'),
	};
}

function indexFilters(filtersArray) {
	return reduce(filtersArray, (acc, filter) => {
		const { name } = filter;
		const id = createFilterIdFromName(name);
		const terminals = indexTerminalsById(filter);
		acc[id] = { ...filter, id, terminals };
		return acc;
	}, {});
}

export default function filters(state = initialState, action) {
    switch (action.type) {
		case 'FILTERS_FETCH': {
            return {
				...state,
				fetching: true
			};
        }
		case 'FILTERS_FETCH_SUCCESS': {
            return {
				...state,
				fetching: false,
                byId: indexFilters([...action.payload, directUploaderConfiguration])
			};
        }
		case 'FILTERS_FETCH_ERROR': {
            return {
				...state,
				fetching: false,
                fetchingError: action.payload
			};
        }
        default: {
            return state;
        }
    }
}
