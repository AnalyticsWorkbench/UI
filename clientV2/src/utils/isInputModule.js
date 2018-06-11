export default function isInputModule(module, filtersById) {
    const { filterId } = module;
    const moduleFilter = filtersById[filterId];
    if (!moduleFilter) return false;
    const inputs = moduleFilter.container.inputs;
    return !inputs || !inputs.length;
}
