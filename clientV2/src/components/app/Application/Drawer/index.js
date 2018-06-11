import map from 'lodash/collection/map';
import cn from 'classnames';
import React, { PropTypes, createClass } from 'react';
import { Scrollbars } from 'react-custom-scrollbars';
import shouldComponentUpdate from 'utils/shouldComponentUpdate';

import Icon from 'components/ui/Icon';
import Creator from './Creator';
import Detail from './Detail';
import Results from './Results';
import Load from './Load';
import Save from './Save';

import enhance from './enhance';
import styles from './styles.scss';

const Drawer = createClass({

    displayName: 'Drawer',

    propTypes: {
        drawerTab: PropTypes.string,
        drawerModuleId: PropTypes.number,
        executing: PropTypes.bool.isRequired,
        workflowActions: PropTypes.object.isRequired,
        className: PropTypes.string
    },

    shouldComponentUpdate: shouldComponentUpdate,

    renderTab() {
        const { drawerTab, drawerModuleId } = this.props;
        if (drawerTab === 'creator') return <Creator/>;
        if (drawerTab === 'detail') return <Detail moduleId={drawerModuleId}/>;
        if (drawerTab === 'results') return <Results/>;
        if (drawerTab === 'load') return <Load/>;
        if (drawerTab === 'save') return <Save/>;
        if (drawerTab === 'upload R script') return <RscriptUpload/>;
    },

    render() {
        const {
            drawerTab,
            drawerModuleId,
            executing,
            workflowActions,
            className,
            ...props
        } = this.props;

        const { showTab, execute, cancel, reset } = workflowActions;

        const tabs = [{
            icon: executing ? 'circle-o-notch' : 'play',
            spin: executing,
            id: 'execute',
            label: executing ? 'Cancel execution' : 'Execute workflow',
            action: executing ? cancel : execute,
            className: styles.execute
        }, {
            icon: 'file',
            id: 'new',
            label: 'New workflow',
            action: reset
        }, {
            icon: 'folder-open',
            id: 'load',
            label: 'Load workflow'
        }, {
            icon: 'floppy-o',
            id: 'save',
            label: 'Save workflow'
        }, {
            icon: 'file-text',
            id: 'rscriptupload',
            label: 'upload R script'
        }, {
            icon: 'table',
            id: 'results',
            label: 'View results'
        }, {
            icon: 'plus',
            id: 'creator',
            label: 'Add module'
        }, {
            icon: 'sliders',
            id: 'detail',
            label: 'Module details'
        }];

        return (
            <div
                className={cn(styles.container, className, drawerTab && styles.open)}
                {...props}>
                <div className={styles.tabs}>
                    {map(tabs, tab => {
                        const {
                            id,
                            icon,
                            spin,
                            action,
                            label,
                            className: tabClassName
                        } = tab;

                        const handleClick = action ? action : () => showTab(id);
                        return (
                            <div
                                key={id}
                                className={cn(
                                    styles.tab,
                                    drawerTab === id && styles.active,
                                    tabClassName
                                )}
                                onClick={handleClick}>
                                <Icon icon={icon} spin={spin}/>
                                <div className={styles.tabLabel}>
                                    <div className={styles.tabLabelInner}>{label}</div>
                                </div>
                            </div>
                        );
                    })}
                </div>
                <Scrollbars className={styles.scrollbars}>
                    <div className={styles.body}>
                        {this.renderTab()}
                    </div>
                </Scrollbars>
            </div>
        );
    }
});

export default enhance(Drawer);
