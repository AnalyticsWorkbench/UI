import filter from 'lodash/collection/filter';
import cn from 'classnames';
import React, { PropTypes, createClass } from 'react';

import shouldComponentUpdate from 'utils/shouldComponentUpdate';
import Icon from 'components/ui/Icon';
import Tabs from 'components/ui/Tabs';

import WorkflowList from './WorkflowList';
import enhance from './enhance';
import styles from './styles.scss';

const tabs = [{
    label: 'Named saves',
    value: 'named'
}, {
    label: 'Auto saves',
    value: 'auto'
}];

const Load = createClass({

    displayName: 'Load',

    propTypes: {
        workflows: PropTypes.array.isRequired,
        workflowActions: PropTypes.object.isRequired,
        className: PropTypes.string
    },
    getInitialState() {
        return {
            tab: 'named'
        };
    },

    shouldComponentUpdate: shouldComponentUpdate,

    handleTabsChange(value) {
        this.setState({ tab: value });
    },

    render() {
        const {
            workflows,
            workflowActions,
            className,
            ...props
        } = this.props;

        const { load, destroy } = workflowActions;
        const { tab } = this.state;

        const finalWorkflows = filter(workflows, ({ name, shortname }) => {
            return tab === 'named'
                ? (shortname !== 'autosave' && name !== 'autosave')
                : (shortname === 'autosave' || name === 'autosave');
        });

        return (
            <div
                className={cn(styles.container, className)}
                {...props}>
                <div className={styles.title}>
                    <Icon icon="folder-open" padded/>Load
                </div>
                <Tabs
                    className={styles.tabs}
                    items={tabs}
                    value={tab}
                    onChange={this.handleTabsChange}/>
                {finalWorkflows.length ?
                    <WorkflowList
                        className={styles.workflows}
                        load={load}
                        destroy={destroy}
                        workflows={finalWorkflows}/> :
                    <div className={styles.empty}>
                        List is empty
                    </div>
                }
            </div>
        );
    }
});

export default enhance(Load);
