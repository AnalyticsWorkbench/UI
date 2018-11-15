import reduce from 'lodash/collection/reduce';
import sortBy from 'lodash/collection/sortBy';
import map from 'lodash/collection/map';
import React, { PropTypes, createClass } from 'react';
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
    select: (field, id ) => {
        const { selectValues, name } = field;
        return (
            <Select
                value={selectValues}
                name={name}
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

    renderField(field, id) {
        console.log(field);
        const { type } = field;
        const render = renderComponentByType[type];
        if (!render) return false;
        return render(field, id);
    },

    renderGroup(field, id) {
        const { label, name } = field;
        return (
            <FormGroup key={id} name={name} label={label}>
                {this.renderField(field, id)}
            </FormGroup>
        );
    },

    renderForm() {
        const { form } = this.props;

        return map(
            sortBy(
                reduce(form, (acc, field, id) => {
                    const { rank } = field;
                    const el = this.renderGroup(field, id);
                    acc[id] = { el, rank };
                    return acc;
                }, {}),
                'rank'
            ), ({ el }) => el);
    },

    render() {
        const { form, ...props } = this.props;
        return (
            <Form {...props}>
                {this.renderForm()}
            </Form>
        );
    }

});
