/* eslint-disable no-else-return */
import reduce from 'lodash/collection/reduce';
import sortBy from 'lodash/collection/sortBy';
import map from 'lodash/collection/map';
import React, {createClass, PropTypes} from 'react';
import Form from 'components/forms/Form';
import FormGroup from 'components/forms/FormGroup';
import Text from 'components/forms/Text';
import File from 'components/forms/File';
import Select from 'components/forms/Select';
import Checkbox from 'components/forms/Checkbox';
import Slider from 'components/forms/Slider';
import Table from 'components/forms/Table';
import AutoComplete from 'components/forms/AutoComplete';
import DateRange from 'components/forms/DateRange';
import graphGeneratorModuleFieldFilter from 'utils/graphGeneratorModuleFieldFilter';

const renderComponentByType = {
    Text: (field, id) => {
        const { placeholder } = field;
        return (
            <Text
                placeholder={placeholder}
                name={id}/>
        );
    },
    // For legacy component descriptions
    string: (field, id) => {
        const { value, name } = field;
        return (
            <Text
                placeholder={value}
                name={name}/>
        );
    },
    // For legacy component descriptions
    int: (field, id) => {
        const { value, name } = field;
        return (
            <Text
                placeholder={value}
                name={name}/>
        );
    },
    File: (field, id) => {
        return (
            <File name={id}/>
        );
    },
    Select: (field, id) => {
        const { options, placeholder } = field;
        return (
            <Select
                name={id}
                placeholder={placeholder}
                options={options}/>
        );
    },
    // For legacy component descriptions
    select: (field, id, onChangeHandler) => {
        const {selectValues, name} = field;
        return (
            <Select
                value={selectValues} //Value needed FBA4
                name={name}
                onSelectChange={onChangeHandler}
                placeholder={selectValues[0]}
                options={selectValues}/>
        );
    },
    Checkbox: (field, id) => {
        const { description } = field;
        return (
            <Checkbox
                name={id}
                value="true"
                label={description}/>
        );
    },
    // For legacy component descriptions
    boolean: (field, id) => {
        const { name, label } = field;
        return (
            <Checkbox
                name={name}
                value="true"
                label={label}/>
        );
    },
    Slider: (field, id) => {
        const { min, max, step } = field;
        return (
            <Slider
                name={id}
                min={min}
                max={max}
                step={step}/>
        );
    },
    AutoComplete: (field, id) => {
        const { options, multi, allowCreate, placeholder } = field;
        return (
            <AutoComplete
                placeholder={placeholder}
                allowCreate={allowCreate}
                multi={multi}
                name={id}
                options={options}/>
        );
    },
    Table: (field, id) => {
        const { columns, dependencies } = field;
        return (
            <Table
                columns={columns}
                dependencies={dependencies}
                name={id}/>
        );
    },
    DateRange: (field, id) => {
        const { min, max } = field;
        return (
            <DateRange
                min={min}
                max={max}
                name={id}/>
        );
    }
};

export default createClass({

    displayName: 'FilterForm',

    propTypes: {
        form: PropTypes.object.isRequired
    },

    getInitialState() { //FBA 6
        if (this.props.form && this.props.form.id && this.props.form.id === 'graphgeneratorfilter') {
            return {
                fields: this.props.form.container.fields || []
            };
        }
        else {
            return {fields: this.props.form || []};
        }
    },
    componentWillReceiveProps(newProps) {
        if (newProps.form === this.props.form) return;
        if (newProps.form &&
            newProps.form.id &&
            newProps.form.id === 'graphgeneratorfilter'
        ) {
            this.setState({fields: newProps.form.container.fields || []});
        } else if (!newProps.form || !newProps.form.id || newProps.form.id !== 'graphgeneratorfilter') {
            this.setState({fields: newProps.form || []});
        }
    },
    onSelectChangeHanlder(ev) {
        console.log(ev);
        const selectedValue = ev.target.value;
        if (this.props.form.id === 'graphgeneratorfilter') {
            debugger;
            const fields = graphGeneratorModuleFieldFilter(this.props.form.container, selectedValue);
            // this.renderForm(fields);
            this.setState({fields}, () => this.renderForm(this.state.fields));
            this.forceUpdate();
        }
    },

    renderField(field, id) {
        const {type} = field;
        const render = renderComponentByType[type];
        if (!render) return false;
        if (type === 'select') {
            return render(field, id, this.onSelectChangeHanlder);
        }
        return render(field, id);// here we add if statement
    },

    renderGroup(field, id) {
        const {label, name} = field;
        return (
            <FormGroup key={id} name={name} label={label}>
                {this.renderField(field, id)}
            </FormGroup>
        );
    },

    renderForm(fields) {
        let f = fields;
        if (!f) {
            f = this.props.form;
        }
        return map(
            sortBy(
                reduce(fields, (acc, field, id) => {
                    const {rank} = field;
                    const el = this.renderGroup(field, id);
                    acc[id] = {el, rank};
                    return acc;
                }, {}),
                'rank'
            ), ({el}) => el);
    },

    render() {
        if (!this.state.fields || this.state.fields.length === 0) return null;
        const {...props} = this.props;
        return (
            <Form {...props}>
                {this.renderForm(this.state.fields)}
            </Form>
        );
    }

});
