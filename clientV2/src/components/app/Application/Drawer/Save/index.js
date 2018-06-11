import cn from 'classnames';
import React, { PropTypes, createClass } from 'react';

import shouldComponentUpdate from 'utils/shouldComponentUpdate';
import Icon from 'components/ui/Icon';
import Button from 'components/ui/Button';
import Form from 'components/forms/Form';
import FormGroup from 'components/forms/FormGroup';
import Text from 'components/forms/Text';
import TextArea from 'components/forms/TextArea';

import enhance from './enhance';
import styles from './styles.scss';

const Save = createClass({

    displayName: 'Save',

    propTypes: {
        saving: PropTypes.bool.isRequired,
        workflowActions: PropTypes.object.isRequired,
        className: PropTypes.string
    },

    getInitialState() {
        return {
            values: {
                name: '',
                description: ''
            }
        };
    },

    shouldComponentUpdate: shouldComponentUpdate,

    handleFormChange(values) {
        this.setState({ values });
    },

    handleFormSubmit(values) {
        const { workflowActions } = this.props;
        const { save } = workflowActions;
        const { name } = values;
        if (!name) return;
        save(values);
    },

    render() {
        const {
            saving,
            workflowActions,
            className,
            ...props
        } = this.props;

        const { values } = this.state;

        return (
            <div
                className={cn(styles.container, className)}
                {...props}>
                <div className={styles.title}>
                    <Icon icon="floppy-o" padded/>Save
                </div>
                <Form
                    values={values}
                    onChange={this.handleFormChange}
                    onSubmit={this.handleFormSubmit}>
                    <FormGroup name="name" label="Workflow name">
                        <Text name="name"/>
                    </FormGroup>
                    <FormGroup name="description" label="Workflow description">
                        <TextArea rows="5" name="description"/>
                    </FormGroup>
                    <Button
                        loading={saving}
                        disabled={saving}
                        icon="floppy-o">
                        Save workflow
                    </Button>
                </Form>
            </div>
        );
    }
});

export default enhance(Save);
