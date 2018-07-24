import map from 'lodash/collection/map';
import every from 'lodash/collection/every';
import createCollectMetaDataWorkflow from 'clientV2/src/utils/createCollectMetaDataWorkflow.js';
import createExecuteData from 'clientV2/src/utils/createExecuteData';
import createUploadData from 'clientV2/src/utils/createUploadData';
import createSaveWiringData from 'clientV2/src/utils/createSaveWiringData';
import getFieldValidationMessage from 'clientV2/src/utils/getFieldValidationMessage';
import validateWorkflow from 'clientV2/src/utils/validateWorkflow';

export function load(wiring) {
    return {
        type: 'WORKFLOW_LOAD',
        payload: wiring
    };
}
export function unsetLoaded() {
    return {
        type: 'WORKFLOW_UNSET_LOADED'
    };
}

export function save(data) {
    return ({ getState, dispatch, request }) => {
        const { name, description } = data;
        const state = getState();
        const workflow = state.workflow;
        const user = state.user.user;

        const saveData = createSaveWiringData({
            shortname: name,
            description: description,
            flag: 3,
            sharing: 'user',
            user: user,
            workflow: workflow
        });

        dispatch({
            type: 'WORKFLOW_SAVE',
            meta: {
                success: { workflow: saveData }
            },
            payload: request({
                command: 'saveWiring',
                data: saveData
            })
        });
    };
}

export function destroy(saveid) {
    return ({ dispatch, request }) => {
        const confirmed = confirm('Are you sure that you want to delete this workflow?');
        if (!confirmed) return;

        dispatch({
            type: 'WORKFLOW_DESTROY',
            payload: request({
                command: 'deleteSaveTuple',
                data: { saveId: saveid }
            })
        });
    };
}

export function fetch() {
    return ({ dispatch, request }) => {
        dispatch({
            type: 'WORKFLOW_FETCH',
            payload: Promise.all([
                request({ command: 'getLoadableWirings' }),
                request({ command: 'getOwnedSaves' })
            ])
        });
    };
}


export function reset() {
    return ({ dispatch }) => {
        const confirmed = confirm('Are you sure that you want to discard the current workflow?');
        if (!confirmed) return;
        dispatch({
            type: 'WORKFLOW_RESET'
        });
    };
}

export function showTab(tab) {
    return {
        type: 'WORKFLOW_SHOW_TAB',
        payload: tab
    };
}

export function addModule(filter) {
    return {
        type: 'WORKFLOW_ADD_MODULE',
        payload: filter
    };
}

export function removeModule(id) {
    return ({ dispatch }) => {
        const confirmed = confirm('Are you sure that you want to remove this module?');
        if (!confirmed) return;
        dispatch({
            type: 'WORKFLOW_REMOVE_MODULE',
            payload: id
        });
    };
}

export function copyModule(id) {
    return {
        type: 'WORKFLOW_COPY_MODULE',
        payload: id
    };
}

export function updateModulePosition(id, position) {
    return {
        type: 'WORKFLOW_UPDATE_MODULE_POSITION',
        payload: { id, position }
    };
}

export function updateModuleValue(id, value) {
    return {
        type: 'WORKFLOW_UPDATE_MODULE_VALUE',
        payload: { id, value }
    };
}

export function showModule(id) {
    return {
        type: 'WORKFLOW_SHOW_MODULE',
        payload: id
    };
}

export function createWire(wire) {
    return {
        type: 'WORKFLOW_CREATE_WIRE',
        payload: wire
    };
}
export function removeWire(wire) {
    return {
        type: 'WORKFLOW_REMOVE_WIRE',
        payload: wire
    };
}

export function updateWire(wire) {
    return {
        type: 'WORKFLOW_UPDATE_WIRE',
        payload: wire
    };
}

export function showCreator() {
    return {
        type: 'WORKFLOW_SHOW_CREATOR'
    };
}

export function showWorkspace() {
    return {
        type: 'WORKFLOW_SHOW_WORKSPACE'
    };
}

export function getResults(runid) {
    return ({ dispatch, request }) => {
        dispatch({
            type: 'WORKFLOW_GET_RESULTS',
            payload: request({
                command: 'getResults',
                data: { runid }
            }),
            meta: {
                success: { runid },
                error: { runid }
            }
        });
    };
}

export function getMetaResults(runid) {
    return ({ dispatch, getState, request }) => {
        const { workflow } = getState();
        const { metaWorkflowByRunid } = workflow;
        const { moduleId } = metaWorkflowByRunid[runid];
        dispatch({
            type: 'WORKFLOW_GET_META_RESULTS',
            payload: request({
                command: 'getResults',
                data: { runid }
            })
            .then(results => {
                return new Promise((resolve, reject) => {
                    const [result] = results;
                    const { resultinfo } = result;
                    const { head } = document;
                    const script = document.createElement('script');
                    script.src = resultinfo;
                    script.onload = () => {
                        const data = { ...window[runid] };
                        window[runid] = undefined;
                        script.parentNode.removeChild(script);
                        resolve({ data, moduleId });
                    };
                    script.onerror = reject;
                    head.appendChild(script);
                });
            }),
            meta: {
                runid,
                moduleId,
                success: { runid, moduleId },
                error: { runid, moduleId }
            }
        });
    };
}

export function setAgentStatus(data) {
    return {
        type: 'WORKFLOW_SET_AGENT_STATUS',
        payload: data
    };
}

export function setRunStatus(data) {
    return ({ dispatch }) => {
        dispatch({
            type: 'WORKFLOW_SET_RUN_STATUS',
            payload: data
        });

        const { status, runid } = data;
        if (status === 3) dispatch(getResults(runid));
    };
}

export function setMetaRunStatus(data) {
    return ({ dispatch }) => {
        dispatch({
            type: 'WORKFLOW_SET_META_RUN_STATUS',
            payload: data
        });

        const { status, runid } = data;
        if (status === 3) dispatch(getMetaResults(runid));
    };
}

export function receiveNotification(notification) {
    return ({ dispatch, getState }) => {
        const { data } = notification;
        const { type, runid } = data;

        const { workflow } = getState();
        const {
            runid: workflowRunid,
            metaWorkflowByRunid
        } = workflow;

        // If this notification is related to our workflow
        if (runid === workflowRunid) {
            if (type === 'agent') dispatch(setAgentStatus(data));
            else if (type === 'run') dispatch(setRunStatus(data));
            return;
        }

        // If this notification is related to one of our meta workflows
        if (metaWorkflowByRunid[runid]) {
            if (type === 'run') dispatch(setMetaRunStatus(data));
            return;
        }
        console.warn('Unhandled notification', data);
    };
}

export function execute() {
    return ({ getState, dispatch, request }) => {
        const state = getState();
        const filtersById = state.filters.byId;
        const workflow = state.workflow;
        const { modulesById, wiresById } = workflow;

        if (!validateWorkflow({ modulesById, wiresById, filtersById })) {
            return alert('The current workflow is not valid. Please check the modules/wire configuration,');
        }

        const user = state.user.user;
        const saveData = createSaveWiringData({
            shortname: 'autosave',
            description: `Automatically saved on ${new Date().toLocaleString()}.`,
            flag: 3,
            sharing: 'user',
            user: user,
            workflow: workflow
        });

        dispatch({
            type: 'WORKFLOW_AUTOSAVE',
            meta: {
                success: { workflow: saveData }
            },
            payload: request({
                command: 'saveWiring',
                data: saveData
            }).then(res => {
                const { saveid } = res;
                const data = createExecuteData({ workflow, filtersById, user, saveid });
                const { runid } = data;
                dispatch({
                    type: 'WORKFLOW_EXECUTE',
                    meta: { runid, saveid },
                    payload: request({
                        command: 'executeWiring',
                        data: {
                            ...data,
                            saveid: saveid
                        },
                        notification: true
                    }).then(() => new Promise(resolve =>
                        createUploadData({ workflow, filtersById, runid }, uploads => resolve(uploads))
                    )).then(uploads => Promise.all(map(uploads, upload => request({
                        command: 'handleDataUpload',
                        data: upload
                    }))))
                });
                return res;
            })
        });
    };
}

export function cancel() {
    return {
        type: 'WORKFLOW_CANCEL',
    };
}

export function metaExecute(moduleIds) {
    return ({ getState, dispatch, request }) => {
        const state = getState();
        const filtersById = state.filters.byId;
        const workflow = state.workflow;
        const { modulesById } = workflow;
        const user = state.user.user;
        moduleIds.forEach(moduleId => {
            const module = modulesById[moduleId];
            const { filterId, value } = module;
            const filter = filtersById[filterId];
            const { container } = filter;
            const { form } = container;

            if (form) {
                const isValid = every(form, (field, id) => {
                    return !getFieldValidationMessage(field, value[id]);
                });
                if (!isValid) return;
            }

            const collectMetaDataWorkflow = createCollectMetaDataWorkflow(module);
            const data = createExecuteData({
                workflow: collectMetaDataWorkflow,
                filtersById,
                user,
            });

            const { runid } = data;
            dispatch({
                type: 'WORKFLOW_META_EXECUTE',
                meta: { runid, moduleId },
                payload: request({
                    command: 'executeWiring',
                    data: data,
                    notification: true
                }).then(() => new Promise(resolve =>
                    createUploadData({ workflow: collectMetaDataWorkflow, filtersById, runid }, uploads => resolve(uploads))
                )).then(uploads => Promise.all(map(uploads, upload => request({
                    command: 'handleDataUpload',
                    data: upload
                }))))
            });
        });
    };
}
