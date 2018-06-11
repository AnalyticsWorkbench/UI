export default function isOutputModule(module, filtersById) {
    const { filterId } = module;
    const moduleFilter = filtersById[filterId];
    if (!moduleFilter) return false;
    const outputs = moduleFilter.container.outputs;
    return !outputs || !outputs.length;
}
