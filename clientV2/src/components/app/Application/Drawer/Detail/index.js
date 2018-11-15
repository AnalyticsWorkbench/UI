import cn from 'classnames';
import React, { PropTypes, createClass } from 'react';

import { colorsByFilterCategory } from 'config';
import shouldComponentUpdate from 'utils/shouldComponentUpdate';
import FilterForm from 'components/forms/FilterForm';
import Tabs from 'components/ui/Tabs';

import MetaInspector from './MetaInspector';
import enhance from './enhance';
import styles from './styles.scss';

const tabs = [{
    label: 'Settings',
    value: 'settings'
}, {
    label: 'Meta data',
    value: 'meta'
}];

const Detail = createClass({

    displayName: 'Detail',

    propTypes: {
        className: PropTypes.string,
        empty: PropTypes.bool,
        filter: PropTypes.object,
        module: PropTypes.object,
        form: PropTypes.object,
        workflowActions: PropTypes.object.isRequired,
        messages: PropTypes.object,
        meta: PropTypes.object,
        metaInput: PropTypes.object,
        isInput: PropTypes.bool,
        isOutput: PropTypes.bool
    },

    getInitialState() {
        return {
            tab: 'settings'
        };
    },

    shouldComponentUpdate: shouldComponentUpdate,

    hanldeFilterFormChange(values) {
        const { workflowActions, module } = this.props;
        const { updateModuleValue } = workflowActions;
        const { id } = module;
        updateModuleValue(id, values);
    },

    handleTabsChange(value) {
        this.setState({ tab: value });
    },

    renderEmpty() {
        return (
            <div className={styles.empty}>
                Select a module to see more information
            </div>
        );
    },

    renderTab() {
        const {
            filter, // See todo below
            module,
            form, // This seems to be always undefined
            messages,
            meta,
            metaInput,
            isInput,
            isOutput
        } = this.props;
        const { tab } = this.state;
        const { value } = module;

        // TODO: form parameter seems to be undefined. For a quick fix it is set here but there might be other problems.
        //if (tab === 'settings' && form) {
        if (tab === 'settings' && filter.container) {

        // For compatibility with old filter descriptions.
         if (form === undefined) {
             return (
                 <FilterForm
                     //form={form}
                    // form={filter.container.fields} //FBA
                     form={filter}
                     values={value}
                     messages={messages}
                     onChange={this.hanldeFilterFormChange}/>
             );
         } else {

             return (
                 <FilterForm
                     // form={form}
                     form={filter.container}
                     values={value}
                     messages={messages}
                     onChange={this.hanldeFilterFormChange}/>
             );
         }
        } else if (tab === 'meta') {
            return (
                <MetaInspector
                    className={styles.inspector}
                    meta={meta}
                    metaInput={metaInput}
                    isInput={isInput}
                    isOutput={isOutput}/>
            );
        }
    },

    render() {
        const {
            empty,
            filter,
            module,
            form,
            workflowActions,
            messages,
            meta,
            metaInput,
            isInput,
            isOutput,
            className,
            ...props
        } = this.props;

        if (empty) return this.renderEmpty();

        const { tab } = this.state;
        const { name } = filter;
        const { container, category } = filter;
        const { descriptionText, legend } = container;
        const { color } = colorsByFilterCategory[category];

        return (
            <div className={cn(styles.container, className)}>
                <div className={styles.header}>
                    <div className={styles.title}>
                        <span className={styles.name}>{name}</span>
                        <div
                            style={{ backgroundColor: color }}
                            className={styles.category}>{category}</div>
                    </div>
                    <div className={styles.legend}>{legend}</div>
                    <div className={styles.description}>{descriptionText}</div>
                </div>
                <Tabs
                    className={styles.tabs}
                    items={tabs}
                    value={tab}
                    onChange={this.handleTabsChange}/>
                {this.renderTab()}
            </div>
        );
    }
});

export default enhance(Detail);
