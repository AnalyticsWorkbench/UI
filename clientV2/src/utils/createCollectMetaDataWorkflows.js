import filter from 'lodash/collection/filter';
import map from 'lodash/collection/map';

import createCollectMetaDataWorkflow from './createCollectMetaDataWorkflow';


export default function createCollectMetaDataWorflows(workflow, filtersById) {
    const { modulesById } = workflow;

    const inputModules = filter(modulesById, module => {
        const { filterId } = module;
        const moduleFilter = filtersById[filterId];
        if (!moduleFilter) return false;
        const inputs = moduleFilter.container.inputs;
        return !inputs || !inputs.length;
    });

    return map(inputModules, module => {
        return createCollectMetaDataWorkflow(module);
    });
}
