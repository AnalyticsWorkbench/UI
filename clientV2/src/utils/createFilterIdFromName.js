export default function createFilterIdFromName(name) {
    // Remove all characters except alphanumeric
    return name.replace(/[^\w]/gi, '').toLowerCase();
}
