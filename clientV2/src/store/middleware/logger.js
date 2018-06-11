export default function logger({ getState }) {
    return next => action => {
        const prevState = getState();
        const returnValue = next(action);
        const nextState = getState();
        const time = new Date();

        if (console.groupCollapsed) {
            console.groupCollapsed(`action ${action.type} @`, `${time.getHours()}:${time.getMinutes()}:${time.getSeconds()}`);
        }

        console.log(`%c prev state`, `color: #9E9E9E; font-weight: bold`, prevState);
        console.log(`%c action`, `color: #03A9F4; font-weight: bold`, action);
        console.log(`%c next state`, `color: #4CAF50; font-weight: bold`, nextState);

        if (console.groupEnd) {
            console.groupEnd('diff');
        }

        return returnValue;
    };
}
