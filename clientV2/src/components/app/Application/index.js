import React, {createClass, PropTypes} from 'react';

import shouldComponentUpdate from 'utils/shouldComponentUpdate';
import StageBase from 'components/ui/Stage';

import Drawer from './Drawer';
import Module from './Module';
import Terminal from './Terminal';
import Wire from './Wire';

import enhance from './enhance';
import styles from './styles.scss';

const Application = createClass({

    displayName: 'Application',

    propTypes: {
        filtersById: PropTypes.object.isRequired,
        modulesById: PropTypes.object.isRequired,
        wiresById: PropTypes.object.isRequired,
        workflowActions: PropTypes.object.isRequired
    },

    shouldComponentUpdate: shouldComponentUpdate,

    handleClick() {
        const { workflowActions } = this.props;
        const { showWorkspace } = workflowActions;
        showWorkspace();
    },

    handleModulePositionChange({ module, x, y }) {
        const { workflowActions } = this.props;
        const { id } = module;
		const { updateModulePosition } = workflowActions;
		updateModulePosition(id, [x, y]);
    },

    handleWireChange(wire) {
        const { workflowActions } = this.props;
		const { updateWire } = workflowActions;
		updateWire(wire);
    },

    renderModule(moduleProps) {
        return <Module {...moduleProps}/>;
    },

    renderTerminal(terminalProps) {
        return <Terminal {...terminalProps}/>;
    },

    renderWire(wireProps) {
        return <Wire {...wireProps}/>;
    },

    render() {
        const {
            filtersById,
            modulesById,
            wiresById,
            workflowActions,
            ...props
        } = this.props;

        const { createWire, removeWire } = workflowActions;

        return (
            <div className={styles.container}>
                <div className={styles.logo}>
                    Analytics Workbench
                </div>
                <StageBase
                    filtersById={filtersById}
                    modulesById={modulesById}
                    wiresById={wiresById}
                    createWire={createWire}
                    removeWire={removeWire}
                    renderModule={this.renderModule}
                    renderTerminal={this.renderTerminal}
                    renderWire={this.renderWire}
                    onClick={this.handleClick}
                    onModulePositionChange={this.handleModulePositionChange}
                    onWireChange={this.handleWireChange}/>
                <Drawer/>
            </div>
        );
    }
});

export default enhance(Application);
