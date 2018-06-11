export default function hexToRgb(hex) {
    return [
        '0x' + hex[1] + hex[2] | 0,
        '0x' + hex[3] + hex[4] | 0,
        '0x' + hex[5] + hex[6] | 0
    ];
}
