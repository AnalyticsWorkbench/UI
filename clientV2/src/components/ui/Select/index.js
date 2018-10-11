import reduce from 'lodash/collection/reduce';
import map from 'lodash/collection/map';
import sortBy from 'lodash/collection/sortBy';
// import Select from 'react-select';
import cn from 'classnames';
import PropTypes from 'prop-types';
import React, {Component} from 'react';
import styles from './styles.scss';


class Select extends React.Component {


    renderOptions(options, multiple, placeholder) {
        const {renderOption} = this.props;
        const children = [];

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

    render() {
        const {
            multiple,
            options,
            value,
            placeholder,
            className,
            ...props
        } = this.props;
        return (
            <select className={cn(className, styles.input)} multiple={multiple} {...props}>
                <option value="Degree">null</option>
                {options.map((opt) => <option value={opt}> {opt} </option>)}
            </select>
        );
    }
}
Select.propTypes = {
    name: PropTypes.string.isRequired,
    options: PropTypes.object.isRequired,
    value: PropTypes.oneOfType([
        PropTypes.string.isRequired,
        PropTypes.array.isRequired
    ]).isRequired.isRequired,
    multiple: PropTypes.bool.isRequired,
    placeholder: PropTypes.any.isRequired,
    renderOption: PropTypes.func.isRequired,
    onChange: PropTypes.func.isRequired,
    children: PropTypes.node.isRequired,
    className: PropTypes.string.isRequired
};

export default Select;


