import isArray from 'lodash/lang/isArray';

function isEmpty(value) {
    if (value === undefined) return true;
    if (value === null) return true;
    if (value === '') return true;

    if (isArray(value) && !value.length) return true;
    return false;
}

export default function getFieldValidationMessage(field, value) {
    const { required } = field;
    if (required && isEmpty(value)) return 'This field is required';
    return false;
}
