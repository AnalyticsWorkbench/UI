/* eslint-disable spaced-comment */
import clone from 'lodash/lang/clone';
import omit from 'lodash/object/omit';
import reduce from 'lodash/collection/reduce';
//import createFilterIdFromName from 'utils/createFilterIdFromName';

const initialState = {
    status: undefined,
    runid: undefined,
    modulesById: {},
    wiresById: {},
    agentsByModuleId: {},
    metaDataByModuleId: {},
    metaWorkflowByRunid: {},
    drawerTab: undefined,
    drawerModuleId: undefined,
    executing: false,
    results: [],
    fetching: false,
    workflowsBySaveId: {},
    saving: false,
    loaded: false,
    changed: false
};

function createId(modulesById) {
    return reduce(modulesById, (acc, wire, id) => {
        return parseInt(id, 10) + 1 > acc ? parseInt(id, 10) + 1 : acc;
    }, 1);
}

export default function workflow(state = initialState, action) {
    switch (action.type) {
        case 'WORKFLOW_LOAD': {
            const { modulesById, wiresById, metaDataByModuleId } = action.payload;
            return {
                ...initialState,
                drawerTab: state.drawerTab,
                drawerModuleId: state.drawerModuleId,
                workflowsBySaveId: state.workflowsBySaveId,
                modulesById,
                wiresById,
                metaDataByModuleId,
                loaded: true
            };
        }

        case 'WORKFLOW_UNSET_LOADED': {
            return {
                ...state,
                loaded: false
            };
        }

        case 'WORKFLOW_SAVE': {
            return {
                ...state,
                saving: true
            };
        }

        case 'WORKFLOW_SAVE_SUCCESS': {
            const { workflow: flow } = action.meta;
            const { saveid } = flow;
            return {
                ...state,
                saving: false,
                workflowsBySaveId: {
                    ...state.workflowsBySaveId,
                    [saveid]: {
                        ...flow,
                        owned: true
                    }
                },
                drawerTab: 'load',
                changed: false
            };
        }

        case 'WORKFLOW_DESTROY': {
            return state;
        }

        case 'WORKFLOW_DESTROY_SUCCESS': {
            const { saveId } = action.payload;
            return {
                ...state,
                workflowsBySaveId: omit(state.workflowsBySaveId, saveId)
            };
        }

        case 'WORKFLOW_FETCH': {
            return {
                ...state,
                fetching: true
            };
        }

        case 'WORKFLOW_FETCH_SUCCESS': {
            const [ workflows, ownedSavesIds ] = action.payload;
            return {
                ...state,
                workflowsBySaveId: reduce(workflows, (acc, flow) => {
                    const { saveid } = flow;
                    if (ownedSavesIds.indexOf(saveid) > -1) flow.owned = true;
                    acc[saveid] = flow;
                    return acc;
                }, {}),
                fetching: false
            };
        }

        case 'WORKFLOW_AUTOSAVE': {
            return state;
        }

        case 'WORKFLOW_AUTOSAVE_SUCCESS': {
            const { workflow: flow } = action.meta;
            const { saveid } = flow;
            return {
                ...state,
                workflowsBySaveId: {
                    ...state.workflowsBySaveId,
                    [saveid]: {
                        ...flow,
                        owned: true
                    }
                },
                changed: false
            };
        }

        case 'WORKFLOW_RESET': {
            return {
                ...initialState,
                drawerTab: state.drawerTab,
                drawerModuleId: state.drawerModuleId,
                workflowsBySaveId: state.workflowsBySaveId
            };
        }

        case 'WORKFLOW_SHOW_TAB': {
            return {
                ...state,
                drawerTab: action.payload
            };
        }

        case 'WORKFLOW_CREATE_WIRE': {
            const wire = action.payload;
            const { id } = wire;
            return {
                ...state,
                wiresById: {
                    ...state.wiresById,
                    [id]: wire
                },
                changed: true
            };
        }

        case 'WORKFLOW_REMOVE_WIRE': {
            const wire = action.payload;
            const { id } = wire;
            return {
                ...state,
                wiresById: omit(state.wiresById, id),
                changed: true
            };
        }

        case 'WORKFLOW_UPDATE_WIRE': {
            const wire = action.payload;
            const { id } = wire;
            return {
                ...state,
                wiresById: {
                    ...state.wiresById,
                    [id]: wire
                },
                changed: true
            };
        }

        case 'WORKFLOW_UPDATE_MODULE_POSITION': {
            const { id, position } = action.payload;
            return {
                ...state,
                modulesById: {
                    ...state.modulesById,
                    [id]: {
                        ...state.modulesById[id],
                        config: {
                            ...state.modulesById[id].config,
                            position
                        }
                    }
                }
            };
        }

        case 'WORKFLOW_UPDATE_MODULE_VALUE': {
            const { id, value } = action.payload;
            return {
                ...state,
                modulesById: {
                    ...state.modulesById,
                    [id]: {
                        ...state.modulesById[id],
                        value: value
                    }
                },
                changed: true
            };
        }

        case 'WORKFLOW_ADD_RECOMMENDED_MODULE': {

            var filter = action.payload;
            const id = createId(state.modulesById);
            filter.id = id;
            return {
                ...state,
                modulesById: {
                    ...state.modulesById,
                    [id]: filter
                }
            }
        }

        case 'WORKFLOW_ADD_MODULE': {
            const filter = action.payload;
            const { id: filterId, container } = filter;
            const { form } = container;
            const id = createId(state.modulesById);
            return {
                ...state,
                modulesById: {
                    ...state.modulesById,
                    [id]: {
                        id: id,
                        filterId: filterId,
                        value: reduce(form, (acc, field, fieldId) => {
                            acc[fieldId] = field.default || '';
                            return acc;
                        }, {}),
                        config: {
                            position: [100, 100]
                        }
                    }
                },
                // Dies sollte demnächst aus der Datenbank kommen.
                recommendedModules : [
                    {
                        filterId: filterId,
                        value: 'betweenness',
                        config: {
                            position: [100, 100]
                        }
                    }
                ],
                changed: true
            };
        }

        case 'WORKFLOW_REMOVE_MODULE': {
            const moduleId = action.payload;
            return {
                ...state,
                modulesById: omit(state.modulesById, moduleId),
                metaDataByModuleId: omit(state.metaDataByModuleId, moduleId),
                wiresById: reduce(state.wiresById, (acc, wire) => {
                    const { id, src, tgt } = wire;
                    const { moduleId: srcModuleId } = src;
                    const { moduleId: tgtModuleId } = tgt;
                    if (srcModuleId !== moduleId && tgtModuleId !== moduleId) acc[id] = wire;
                    return acc;
                }, {}),
                drawerModuleId: moduleId !== state.drawerModuleId
                    ? state.drawerModuleId
                    : undefined,
                changed: true
            };
        }

        case 'WORKFLOW_COPY_MODULE': {
            const moduleId = action.payload;
            const module = state.modulesById[moduleId];
            const newModuleId = createId(state.modulesById);

            const newModule = clone(module, true);
            newModule.id = newModuleId;
            newModule.config.position = [
                module.config.position[0] + 20,
                module.config.position[1] + 20
            ];

            return {
                ...state,
                modulesById: {
                    ...state.modulesById,
                    [newModuleId]: newModule
                },
                changed: true
            };
        }

        case 'WORKFLOW_SHOW_MODULE': {
            return {
                ...state,
                drawerModuleId: action.payload,
                drawerTab: 'detail'
            };
        }

        case 'WORKFLOW_SHOW_CREATOR': {
            return {
                ...state,
                drawerTab: 'creator'
            };
        }

        case 'WORKFLOW_SHOW_WORKSPACE': {
            return {
                ...state,
                drawerTab: undefined
            };
        }

        case 'WORKFLOW_EXECUTE': {
            return {
                ...state,
                runid: action.meta.runid,
                agentsByModuleId: reduce(state.modulesById, (acc, { id }) => {
                    acc[id] = { status: 1 };
                    return acc;
                }, {}),
                executing: true
            };
        }

        case 'WORKFLOW_CANCEL': {
            return {
                ...state,
                runid: undefined,
                agentsByModuleId: {},
                executing: false,
            };
        }

        case 'WORKFLOW_GET_RESULTS': {
            return state;
        }

        case 'WORKFLOW_GET_RESULTS_SUCCESS': {
            const { meta, payload: results } = action;
            const { runid } = meta;
            return {
                ...state,
                results: state.results.concat({ runid, results }),
                executing: false,
                drawerTab: 'results',
                agentsByModuleId: {}
            };
        }

        case 'WORKFLOW_SET_AGENT_STATUS': {
            const { instanceid: moduleId } = action.payload;
            return {
                ...state,
                agentsByModuleId: {
                    ...state.agentsByModuleId,
                    [moduleId]: action.payload
                }
            };
        }

        case 'WORKFLOW_SET_RUN_STATUS': {
            const { status } = action.payload;

            if (status === 5) {
                return {
                    ...state,
                    status: action.payload,
                    executing: false,
                    agentsByModuleId: reduce(state.agentsByModuleId, (acc, agent) => {
                        const { instanceid, status: agentStatus } = agent;
                        if (agentStatus === 5) acc[instanceid] = agent;
                        return acc;
                    }, {})
                };
            }

            return {
                ...state,
                status: action.payload
            };
        }

        case 'WORKFLOW_META_EXECUTE': {
            const { runid, moduleId } = action.meta;
            return {
                ...state,
                metaWorkflowByRunid: {
                    [runid]: {
                        status: 1,
                        moduleId
                    }
                },
                metaDataByModuleId: {
                    ...state.metaDataByModuleId,
                    [moduleId]: undefined
                }
            };
        }

        case 'WORKFLOW_SET_META_RUN_STATUS': {
            const { runid } = action.payload;
            return {
                ...state,
                metaWorkflowByRunid: {
                    [runid]: {
                        ...state.metaWorkflowByRunid[runid],
                        ...action.payload
                    }
                }
            };
        }

        case 'WORKFLOW_GET_META_RESULTS': {
            return state;
        }

        case 'WORKFLOW_GET_META_RESULTS_SUCCESS': {
            const { data, moduleId } = action.payload;

            const { runid } = action.meta;
            //const newRunId = "7ff953ee-9059-46d9-ab41-d4116cc18868"; //FBA MANUAL ADDD
            //const newData = window[newRunId]; //FBA MANUAL ADDD

            const newState = {
                ...state,
                metaDataByModuleId: {
                    ...state.metaDataByModuleId,
                    [moduleId]: data
                    //[moduleId]: newData // MANUAL ADDD
                },
                metaWorkflowByRunid: omit(state.metaWorkflowByRunid, runid)
            };
            return newState;
        }

        default: {
            return state;
		}
    }
}
