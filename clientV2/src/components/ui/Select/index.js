import reduce from 'lodash/collection/reduce';
import map from 'lodash/collection/map';
import sortBy from 'lodash/collection/sortBy';
import Select from 'react-select';
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

        const mapped = map(options, (label, value) => {
            return { label, value };
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

        return reduce(sorted, (acc, { label, value }) => {
            acc.push(renderOption({
                key: value,
                value,
                children: label
            }));
            return acc;
        }, children);
    },

    render() {
        const {
            multiple,
            options,
            placeholder,
            className,
            ...props
        } = this.props;
        //const finalValue = 0;
        // if (placeholder && !value) {
        //     // Set empty string as default value.
        //     // This will show up the placeholder option, when no value is set.
        //     finalValue = '';ß
        // }
        return (
            <slect className={cn(className, styles.input)} value={[options[1]]} multiple={multiple}>
                {options.map((opt) => <option value={opt}> {opt} </option>)}
            </slect>
        );
    }
});

// {/*{options*/}
// {/*? this.renderOptions(options, multiple, placeholder)*/}
// {/*: children}*/}


