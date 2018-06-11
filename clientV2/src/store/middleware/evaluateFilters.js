let scriptId = 0;
function evaluateScript(str) {
    const { head } = document;
    const id = ++scriptId;
    const wrapped = `
        (function() {
            window.evaluatedScripts = window.evaluatedScripts || {};
            window.evaluatedScripts[${id}] = (function() {
                try {
                    ${str}
                    return main;
                } catch (e) {
                    console.warn('Failed to evaluate script');
                }
            })();
        })();
    `;
    const script = document.createElement('script');
    const content = document.createTextNode(wrapped);
    script.appendChild(content);
    head.appendChild(script);
    return window.evaluatedScripts[id];
}

function evaluateFilter(filter) {
    const { container } = filter;
    const { js_update_form, js_transform_meta } = container;
    const nextContainer = {
        ...container,
        ...(js_update_form && {
            js_update_form: evaluateScript(js_update_form)
        }),
        ...(js_transform_meta && {
            js_transform_meta: evaluateScript(js_transform_meta)
        })
    };
    return {
        ...filter,
        container: nextContainer
    };
}

export default function evaluateFiltersMiddleware() {
    return next => action => {
        const { type, payload } = action;

        if (type !== 'FILTERS_FETCH_SUCCESS') {
            return next(action);
        }

        const nextPayload = payload.map(evaluateFilter);
        const nextAction = { ...action, payload: nextPayload };
        return next(nextAction);

    };
}
