import padLeft from 'lodash/string/padLeft';

function padTime(time) {
    return padLeft(time, 2, '0');
}

export default function createDate() {
    const now = new Date();
    return [
        now.getUTCFullYear(),
        now.getUTCMonth() + 1,
        now.getUTCDate(),
        now.getUTCHours(),
        now.getUTCMinutes(),
        now.getUTCSeconds()
    ].map(time => padTime(time)).join('');
}
