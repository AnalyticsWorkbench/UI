export function fetch() {
    return ({ dispatch, request }) => {
        dispatch({
            type: 'FILTERS_FETCH',
            payload: request({ command: 'getFilterDescriptions' })
        });
    };
}
