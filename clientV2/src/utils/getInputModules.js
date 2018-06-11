import filter from 'lodash/collection/filter';
import isInputModule from './isInputModule';

export default function getInputModules(workflow, filtersById) {
    const { modulesById } = workflow;
    return filter(modulesById, module => {
        return isInputModule(module, filtersById);
    });
}
