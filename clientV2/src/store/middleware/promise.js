function isPromise(value) {
    return value && typeof value.then === 'function';
}

export default function promiseMiddleware() {
    return next => action => {
        if (!isPromise(action.payload)) {
            return next(action);
        }

        const { type, meta = {}, afterSuccess, afterError } = action;
        const promise = action.payload;
        const { success, error, ...pending } = meta;

        const PENDING_TYPE = type;
        const SUCCESS_TYPE = type + '_SUCCESS';
        const ERROR_TYPE = type + '_ERROR';

        const PENDING_META = { promise: true, status: 'PENDING' };
        const SUCCESS_META = { promise: true, status: 'SUCCESS' };
        const ERROR_META = { promise: true, status: 'ERROR' };

        /**
        * Dispatch the first async handler. This tells the
        * reducer that an async action has been dispatched.
        */
        next({
			type: PENDING_TYPE,
			meta: {
				...PENDING_META,
				...pending
			}
		});

        /**
        * Return either the fulfilled action object or the rejected
        * action object.
        */
        return promise
            .then(
                payload => {
                    next({
                        type: SUCCESS_TYPE,
                        payload,
                        meta: {
                            ...SUCCESS_META,
                            ...(typeof success === 'function'
                                ? success(payload)
                                : success)
                        }
                    });

                    if (typeof afterSuccess === 'function') {
                        afterSuccess(payload);
                    }
                },
                err => {
                    next({
                        type: ERROR_TYPE,
                        payload: err,
                        error: true,
                        meta: {
                            ...ERROR_META,
                            ...(typeof error === 'function'
                                ? error(err)
                                : error)
                            },
                    });

                    if (typeof afterError === 'function') {
                        afterError(err);
                    }
                }
            );
    };
}
