let requestId = 0;
function getRequestId() {
    return 'r' + requestId++;
}

export default function createRequester(socket) {
    const resolveByRequestId = {};
    socket.on('response', response => {
        const { reqid, data } = response;
        const resolve = resolveByRequestId[reqid];
        if (!resolve) return console.warn('Got unregisterd response with id `' + reqid + '`', data);
        resolve(data);
    });

    return function request(options) {
        return new Promise((resolve, reject) => {
            const id = getRequestId();
            const { command, data, notification } = options;
            if (!command) return reject(new Error('You need to provide a command when performing a request'));
            resolveByRequestId[id] = resolve;
            socket.emit('request', { id, command, data, notification });
        });
    };
}
