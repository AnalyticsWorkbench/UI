import shallowEqual from './shallowEqual';

function getKeyDiff(obj1, obj2) {
	const keys = {};
	for (const key in obj1) {
		if (obj1[key] !== obj2[key]) {
			keys[key] = {prev: obj1[key], next: obj2[key]};
		}
	}
	return keys;
}

const shouldComponentUpdate = (nextProps, nextState) => {
	const propsEqual = shallowEqual(this.props, nextProps);
	const stateEqual = shallowEqual(this.state, nextState);

	const shouldUpdate = !propsEqual || !stateEqual;

	if (false && shouldUpdate) {
		console.groupCollapsed(`%c ${this.constructor.displayName} updates`,  `color: #EA2C7C; font-weight: bold`);
		if (!propsEqual) {
			console.log(`%c props differ`, `color: #EA2C7C; font-weight: bold`, getKeyDiff(this.props, nextProps));
		}

		if (!stateEqual) {
			console.log(`%c states differ`, `color: #EA2C7C; font-weight: bold`);
			console.table(getKeyDiff(this.state, nextState));
		}
		console.groupEnd('diff');
	}

	return shouldUpdate;
};
export default shouldComponentUpdate
