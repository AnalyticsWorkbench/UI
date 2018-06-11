import without from 'lodash/array/without';
import isArray from 'lodash/lang/isArray';
import sortBy from 'lodash/collection/sortBy';
import map from 'lodash/collection/map';
import reduce from 'lodash/collection/reduce';
import cn from 'classnames';
import React, { PropTypes, createClass } from 'react';
import { connectInput } from 'react-formalize';
import Button from 'components/ui/Button';
import Text from 'components/ui/Text';
import Select from 'components/ui/Select';
import AutoComplete from 'components/ui/AutoComplete';
import styles from './styles.scss';

const ComponentByType = {
    Text: Text,
    Select: props => {
        const { options, ...rest } = props;
        let finalOptions = options;
        if (isArray(options)) {
            finalOptions = options.reduce((acc, option) => {
                acc[option] = option;
                return acc;
            }, {});
        }

        return (
            <Select options={finalOptions} {...rest}/>
        );
    },
    AutoComplete: props => {
        const { options, ...rest } = props;
        const finalOptions = map(options, option => {
            return option.toString();
        });
        return (
            <AutoComplete
                options={finalOptions}
                {...rest}/>
        );
    }
};

const serializeByType = {
	Text: event => {
		const target = event.target;
		const { value } = target;
		return value;
	},
	Select: event => {
        const target = event.target;
        const { value, type } = target;
        if (type === 'select-multiple') {
            const values = [];
            const { options } = target;
            for (let i = 0, l = options.length; i < l; i++) {
                const option = options[i];
                if (option.selected) values.push(option.value);
            }
            return values;
        }
        return value;
    },
    AutoComplete: option => {
        if (option) {
            if (Array.isArray(option)) return option.map(({ value }) => value);
            const { value } = option;
            return value;
        }
    }
};

const Table = createClass({

	displayName: 'Table',

	propTypes: {
		className: PropTypes.string,
		value: PropTypes.array,
		dependencies: PropTypes.array,
        columns: PropTypes.object,
		onChange: PropTypes.func,
	},

    getDefaultProps() {
        return {
            dependencies: []
        };
    },

	getInitialState() {
		return {
			form: {}
		};
	},

	handleInputChange(type, id, event) {
		const serialize = serializeByType[type];
		const value = serialize(event);
		const { form } = this.state;
		this.setState({ form: { ...form, [id]: value } });
	},

	handleAddClick() {
		const { value, onChange } = this.props;
		const { form } = this.state;
		onChange(value.concat(form));
		this.setState({ form: {} });
	},

    handleRemoveClick(value) {
        const { value: values, onChange } = this.props;
        onChange(without(values, value));
    },

	renderHead() {
		const { columns, dependencies } = this.props;
		const { form } = this.state;
		const columnsWithId = map(columns, (column, id) => ({ ...column, id }));
		const inputs = sortBy(columnsWithId, 'rank');
		return (
			<tr>
				{map(inputs, input => {
					const { type, label, id, width, ...rest } = input;
					const Component = ComponentByType[type];
					const value = form[id] || '';
					const onChange = this.handleInputChange.bind(this, type, id);

                    const dependants = reduce(dependencies, (acc, dependency) => {
                        const { target, source, targetProperty, map: valueMap } = dependency;
                        if (target && source && targetProperty && valueMap) {
                            if (target === id) {
                                const sourceValue = form[source];
                                const targetPropertyValue = valueMap[sourceValue];
                                if (targetPropertyValue) {
                                    acc[targetProperty] = targetPropertyValue;
                                }
                            }
                        }
                        return acc;
                    }, {});

                    console.log('dependants', dependants);

					return (
						<td
                            width={width}
							key={id}
							className={styles.headColumnInput}>
							<Component
								onChange={onChange}
								value={value}
								placeholder={label}
								{...rest}
                                {...dependants}/>
						</td>
					);
				})}
				<td className={styles.headColumnAdd}>
					<Button
						appearance="highlight"
						type="button"
						onClick={this.handleAddClick}
						icon="plus"/>
				</td>
			</tr>
		);
	},

	renderBody() {
		const { value: rows, columns } = this.props;
		const columnsWithId = map(columns, (column, id) => ({ ...column, id }));
		const inputs = sortBy(columnsWithId, 'rank');

		return map(rows, (row, idx) => {
			return (
				<tr key={idx}>
					{map(inputs, input => {
						const { id } = input;
						return (
							<td key={id}>{row[id]}</td>
						);
					})}
					<td className={styles.bodyColumnRemove}>
						<Button
							type="button"
							onClick={this.handleRemoveClick.bind(this, row)}
							icon="times"/>
					</td>
				</tr>
			);
		});
	},

	render() {
        const {
            value,
            columns,
            onChange,
            className,
            ...props
        } = this.props;

        return (
            <table className={cn(styles.table, className)}>
				<tbody>
					{this.renderHead()}
					{this.renderBody()}
				</tbody>
            </table>
        );
    }
});

const serialize = value => value;
const mapStateToProps = ({ value, disabled }) => ({
	value: value || [],
    disabled
});

export default connectInput(Table, { serialize, mapStateToProps });
