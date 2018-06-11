export default function createCollectMetaDataWorkflow(module) {
    const { id } = module;
    return {
        modulesById: {
            [id]: module,
            meta: {
                id: 'meta',
                filterId: 'metaanalysis',
                value: {}
            }
        },
        wiresById: {
            0: {
                id: 0,
                src: {
                    moduleId: id,
                    terminal: 'out_1'
                },
                tgt: {
                    moduleId: 'meta',
                    terminal: 'in_1s'
                }
            }
        }
    };
}
