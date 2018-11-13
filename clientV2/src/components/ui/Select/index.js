import reduce from 'lodash/collection/reduce';
import map from 'lodash/collection/map';
import sortBy from 'lodash/collection/sortBy';
import cn from 'classnames';
import React, { PropTypes, createClass } from 'react';

const defaultRenderOption = props => <option {...props}/>;

import styles from './styles.scss';

export default createClass({

    displayName: 'Select',

    propTypes: {
        name: PropTypes.string,
        options: PropTypes.object,
        value: PropTypes.oneOfType([
            PropTypes.string,
            PropTypes.array
        ]).isRequired,
        multiple: PropTypes.bool,
        placeholder: PropTypes.any,
        renderOption: PropTypes.func,
        onChange: PropTypes.func.isRequired,
        children: PropTypes.node,
        className: PropTypes.string
    },

    getDefaultProps() {
        return {
            renderOption: defaultRenderOption
        };
    },

    renderOptions(options, multiple, placeholder) {
        const { renderOption } = this.props;
        const children = [];
        if (options) {
            const mapped = map(options, (label) => {  // FBA 4 value for label is not necessary. ORGIN: (label, value) =>
                return {label, options};
            });

            const sorted = sortBy(mapped, 'label');

            if (!multiple && placeholder) {
                children.push(
                    renderOption({
                        key: 'placeholder',
                        value: '',
                        disabled: true,
                        children: placeholder
                    })
                );
            }

            return reduce(sorted, (acc, {label, value}) => {
                acc.push(renderOption({
                    key: value,
                    value,
                    children: label
                }));
                return acc;
            }, children);
        }
        if (!options) {
            const mapped = map(options, (label, value) => {
                return {label, value};
            });

            const sorted = sortBy(mapped, 'label');

            if (!multiple && placeholder) {
                children.push(
                    renderOption({
                        key: 'placeholder',
                        value: '',
                        disabled: true,
                        children: placeholder
                    })
                );
            }

            return reduce(sorted, (acc, {label, value}) => {
                acc.push(renderOption({
                    key: value,
                    value,
                    children: label
                }));
                return acc;
            }, children);
        }
    },

    render() {
        const {
            multiple,
            children,
            value,
            options,
            placeholder,
            className,
            name,
            ...props
        } = this.props;

        let finalValue = options[value]; // FBA4 here was the bug that numberized final value
        if (placeholder && !value) {
            // Set empty string as default value.
            // This will show up the placeholder option, when no value is set.
            finalValue = '';
        }
        if (!finalValue) {
            if (name === 'value1' && !value) {
                finalValue = 'Degree';
            } else {
                finalValue = value;
            }
        }
        if (value === '0') {
            finalValue = 'Degree';
        }
        // if (value === 'Forest-fire') {
        //     return (
        //         <div>
        //             <select className={cn(className, styles.input)} value={finalValue} multiple={multiple}{...props}>
        //                 {options ? this.renderOptions(options, multiple, placeholder) : children}
        //             </select>
        //         </div>
        //     );
        // }
        // noinspection JSAnnotator
        return (
            <div>
                <select className={cn(className, styles.input)} value={finalValue} multiple={multiple}{...props}>
                    {options ? this.renderOptions(options, multiple, placeholder) : children}
                </select>
            </div>
        );
    }
});