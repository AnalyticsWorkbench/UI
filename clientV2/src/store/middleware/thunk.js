import mapValues from 'lodash/object/mapValues';

export default function createThunkMiddleware(utils) {
	let bindedUtils;
	return function thunkMiddleware({ dispatch, getState }) {
		bindedUtils = bindedUtils ? bindedUtils : mapValues(utils, util => options => util(options, getState));
		return next => action =>
			typeof action === 'function' ?
				action({ ...bindedUtils, dispatch, getState }) :
				next(action);
		};
}
