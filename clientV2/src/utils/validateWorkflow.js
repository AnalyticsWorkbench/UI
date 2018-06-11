import every from 'lodash/collection/every';
import getFieldValidationMessage from 'utils/getFieldValidationMessage';

export default function validateWorkflow({ modulesById, filtersById }) {
    return every(modulesById, module => {
        const { filterId, value } = module;
        const filter = filtersById[filterId];
        const { container } = filter;
        const { form } = container;

        if (!form) return true;
        return every(form, (field, id) => {
            return !getFieldValidationMessage(field, value[id]);
        });
    });
}
