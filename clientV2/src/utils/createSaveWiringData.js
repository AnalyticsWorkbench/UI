import cloneDeep from 'lodash/lang/cloneDeep';
import createUniqueId from './createUniqueId';
import createDate from './createDate';

function clean(wiring) {
    return cloneDeep(wiring, value => {
        if (value instanceof FileList) return '';
    });
}

export default function createSaveWiringData(options = {}) {
    const {
        user,
        workflow,
        shortname,
        description,
        flag,
        sharing
    } = options;

    const { modulesById, wiresById, metaDataByModuleId } = workflow;
    const { id: userId } = user;

    return {
        date: createDate(),
        description: description,
        flag: flag,
        saveid: createUniqueId(),
        sharing: sharing,
        shortname: shortname,
        name: shortname,
        username: userId,
        wiring: clean({
            modulesById,
            wiresById,
            metaDataByModuleId
        })
    };
}
