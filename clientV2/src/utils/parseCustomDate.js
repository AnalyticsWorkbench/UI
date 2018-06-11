export default function parseCustomDate(str) {
    const year = parseInt(str.slice(0, 4), 10);
    const month = parseInt(str.slice(4, 6), 10);
    const day = parseInt(str.slice(6, 8), 10);
    const hour = parseInt(str.slice(8, 10), 10);
    const minutes = parseInt(str.slice(10, 12), 10);
    const seconds = parseInt(str.slice(12, 14), 10);
    return new Date(year, month, day, hour, minutes, seconds);
}
