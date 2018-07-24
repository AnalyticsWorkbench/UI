import getInputModules from 'clientV2/src/utils/getInputModules';
import { unsetLoaded } from 'clientV2/src/actions/workflow';
import { metaExecute } from 'clientV2/src/actions/workflow';

export default createStore => (reducer, initialState) => {
	const store = createStore(reducer, initialState);
    let inputModulesValues = [];
    store.subscribe(() => {
        const { workflow, filters } = store.getState();
        const { byId } = filters;
		const { loaded } = workflow;
        const inputModules = getInputModules(workflow, byId);
        const nextInputModulesValues = inputModules.map(({ value }) => value);

        const changed = nextInputModulesValues.reduce((acc, values, idx) => {
            if (inputModulesValues[idx] !== values) {
                const mod = inputModules[idx];
                const { id } = mod;
                acc.push(id);
            }
            return acc;
        }, []);

        if (changed.length) {
            inputModulesValues = nextInputModulesValues;
			if (!loaded) store.dispatch(metaExecute(changed));
			else store.dispatch(unsetLoaded());
        }
    });
	return store;
};
