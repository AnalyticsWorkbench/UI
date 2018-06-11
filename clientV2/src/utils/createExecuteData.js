import reduce from 'lodash/collection/reduce';
import map from 'lodash/collection/map';
import createDate from './createDate';
import createUniqueId from './createUniqueId';

function findSuccessors(moduleId, modulesById, wiresById) {
    return reduce(wiresById, (acc, { src, tgt }) => {
        const { moduleId: srcModuleId } = src;
        const { moduleId: tgtModuleId } = tgt;
        if (moduleId === srcModuleId) acc.push(tgtModuleId);
        return acc;
    }, []);
}

function findAllSuccessors(moduleId, modulesById, wiresById) {
    const successors = findSuccessors(moduleId, modulesById, wiresById);
    return reduce(successors, (acc, successor) => {
        acc.push(...findAllSuccessors(successor, modulesById, wiresById));
        return acc;
    }, successors);
}

function getTree(modulesById, wiresById) {
    return map(modulesById, module => {
        const { id } = module;
        const successors = findAllSuccessors(id, modulesById, wiresById);
        return { id, successors };
    });
}

function getPipes(moduleId, wiresById) {
    return reduce(wiresById, (acc, { src, tgt }) => {
        const { moduleId: srcModuleId } = src;
        const { moduleId: tgtModuleId } = tgt;
        const { terminal } = src;
        if (moduleId === tgtModuleId) acc.push(srcModuleId + '.' + terminal);
        return acc;
    }, []).join(',');
}

function getNewValues(values) {
    return JSON.stringify(values, (key, value) => {
        if (value instanceof FileList) {
            return map(value, ({ name }) => name);
        }
        return value;
    });
}

function getOldValues(values) {
    return map(values, value => {
        if (value instanceof FileList) {
            return map(value, ({ name }) => name).join(',');
        }
        return value;
    }).join(',');
}

function getFilters(runid, modulesById, wiresById, filtersById) {
    return map(modulesById, module => {
        const { id, filterId, value } = module;
        const { name: agentid } = filtersById[filterId];
        return {
            runid,
            agentid,
            instanceid: id,
            pipes: getPipes(id, wiresById),
            newvalues: getNewValues(value),
            oldvalues: getOldValues(value)
        };
    });
}

export default function createExecuteData(options = {}) {
    const {
        workflow,
        filtersById,
        user,
        saveid
    } = options;

    const { modulesById, wiresById } = workflow;
    const { id: userId } = user;
    const runid = createUniqueId();

    return {
        date: createDate(),
        runid: runid,
        tree: getTree(modulesById, wiresById),
        filters: getFilters(runid, modulesById, wiresById, filtersById),
        saveid: saveid,
        username: userId
    };
}
