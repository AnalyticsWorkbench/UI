import reduce from 'lodash/collection/reduce';

function getIncommingModulesByModuleId(wiresById) {
	return reduce(wiresById, (acc, wire) => {
		const { src, tgt } = wire;
		const { moduleId: tgtModuleId, terminal: tgtTerminal } = tgt;
		const { moduleId: srcModuleId} = src;
		if (!acc[tgtModuleId]) acc[tgtModuleId] = [];
		acc[tgtModuleId].push({ moduleId: srcModuleId, terminal: tgtTerminal });
		return acc;
	}, {});
}

export default function getMetaData(moduleId, modulesById, wiresById, filtersById, metaDataByModuleId) {
	const incommingModulesByModuleId = getIncommingModulesByModuleId(wiresById);

	function reduceIncommingModules(incommingModules, walkFn) {
		return reduce(incommingModules, (acc, incommingModule) => {
			const { moduleId: incommingModuleId, terminal } = incommingModule;
			acc[terminal] = walkFn(incommingModuleId);
			return acc;
		}, {});
	}

	function getIncommingModulesByModules(id) {
		return incommingModulesByModuleId[id] || [];
	}

	function walk(id) {
		const module = modulesById[id];
		const incommingModules = incommingModulesByModuleId[id] || [];

		// If module is an input module return meta data;
		if (!incommingModules.length) return metaDataByModuleId[id];

		const { filterId, value } = module;
		const filter = filtersById[filterId];
		const { js_transform_meta, form } = filter.container;

		const metaByInput = reduceIncommingModules(incommingModules, walk);

		if (!js_transform_meta) return undefined; // we have no transform_meta
		return js_transform_meta(form, value, metaByInput);
	}

	const incommingModules = getIncommingModulesByModules(moduleId);
	return reduceIncommingModules(incommingModules, walk);
}
