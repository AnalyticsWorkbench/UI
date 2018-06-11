import io from 'io';
export default function createSocket() {
    return io.connect();
}
