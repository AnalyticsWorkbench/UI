import sortBy from 'lodash/collection/sortBy';
import isString from 'lodash/lang/isString';
import map from 'lodash/collection/map';
import indexBy from 'lodash/collection/indexBy';
import uniq from 'lodash/array/uniq';
import React, { createClass, PropTypes } from 'react';
import Select from 'react-select';
import './styles.scss';

const AutoComplete = createClass({

    displayName: 'AutoComplete',

    propTypes: {
        allowCreate: PropTypes.bool,
        multi: PropTypes.bool,
        options: PropTypes.array,
        value: PropTypes.oneOfType([
            PropTypes.string,
            PropTypes.number,
            PropTypes.array
        ])
    },

    getInitialState() {
        return {
            inputValue: ''
        };
    },

    handleInputChange(inputValue) {
        this.setState({ inputValue });
    },

    render() {
        const { options, value, multi, allowCreate, ...rest } = this.props;
        const { inputValue } = this.state;

        const finalOptions = map(options, option => {
            if (isString(option)) return { label: option, value: option };
            return option;
        });

        const finalValue = !value ? multi ? [] : null : value;

        if (allowCreate) {
            if (inputValue) finalOptions.push({ label: inputValue, value: inputValue });

            if (multi) {
                const optionsByValue = indexBy(finalOptions, 'value');
                finalValue.forEach(v => {
                    if (!optionsByValue[v]) {
                        finalOptions.push({ value: v, label: v });
                    }
                });
            } else {
                finalOptions.push({ value: finalValue, label: value });
            }
        }

        const uniqOptions = uniq(finalOptions, 'value');
        const sortedOptions = sortBy(uniqOptions, 'label');

        return (
            <Select
                multi={multi}
                value={finalValue}
                onInputChange={this.handleInputChange}
                options={sortedOptions}
                {...rest}/>
        );
    }
});

export default AutoComplete;
