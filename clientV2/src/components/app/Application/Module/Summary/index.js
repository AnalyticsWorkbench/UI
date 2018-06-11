import size from 'lodash/collection/size';
import isString from 'lodash/lang/isString';
import isArray from 'lodash/lang/isArray';
import isPlainObject from 'lodash/lang/isPlainObject';
import reduce from 'lodash/collection/reduce';
import map from 'lodash/collection/map';
import sortBy from 'lodash/collection/sortBy';
import cn from 'classnames';
import React, { PropTypes, createClass } from 'react';

import Icon from 'components/ui/Icon';

import shouldComponentUpdate from 'utils/shouldComponentUpdate';
import getFieldValidationMessage from 'utils/getFieldValidationMessage';
import styles from './styles.scss';

function arrayToString(arr) {
    return map(arr, value => toString(value)).join(', ');
}

function objectToString(obj) {
    return map(obj, (value, prop) => `${prop}:${toString(value)}`).join(', ');
}

function fileListToString(list) {
    return map(list, ({ name }) => name).join(', ');
}

function toString(src) {
    if (isString(src)) return src;
    else if (isArray(src)) return arrayToString(src);
    else if (isPlainObject(src)) return objectToString(src);
    else if (src instanceof FileList) return fileListToString(src);
    return '' + src;
}

export default createClass({

    displayName: 'Summary',

    propTypes: {
        className: PropTypes.string,
        filter: PropTypes.object.isRequired,
        module: PropTypes.object.isRequired
    },

    shouldComponentUpdate: shouldComponentUpdate,

    renderGroup(field, value, id) {
        const { label } = field;
        const finalValue = value ? toString(value) : '-';
        const message = getFieldValidationMessage(field, value);
        return (
            <div
                key={id}
                className={styles.group}>
                <div className={styles.label}>
                    {message && <span className={styles.warning}><Icon icon="warning" padded/></span>}
                    {label}
                </div>
                <div className={styles.value}>{finalValue}</div>
            </div>
        );
    },

    renderGroups() {
        const { filter, module } = this.props;
        const { value: values } = module;
        const { container } = filter;
        const { form } = container;
        return map(
            sortBy(
                reduce(form, (acc, field, id) => {
                    const { rank } = field;
                    const value = values[id];
                    const el = this.renderGroup(field, value, id);
                    acc[id] = { el, rank };
                    return acc;
                }, {}),
                'rank'
            ), ({ el }) => el);
    },

    render() {
        const { className, filter, module, ...props } = this.props;
        const { value: values } = module;
        const { container } = filter;
        const { form } = container;
        if (!size(values) || !form) return false;
        return (
            <div
                className={cn(styles.container, className)}
                {...props}>
                {this.renderGroups()}
            </div>
        );
    }

});
