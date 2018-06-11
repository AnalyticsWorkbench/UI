export function receive(user) {
    return {
        type: 'USER_RECEIVE',
        payload: user
    };
}
