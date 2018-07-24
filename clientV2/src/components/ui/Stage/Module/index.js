import css from 'dom-css';
import cn from 'classnames';
import filter from 'lodash/collection/filter';
import map from 'lodash/collection/map';
import React, { PropTypes, createClass } from 'react';
import shouldComponentUpdate from 'clientV2/src/utils/shouldComponentUpdate';

import styles from './styles.scss';

export default createClass({
    displayName: 'Module',

    propTypes: {
        module: PropTypes.object.isRequired,
        terminals: PropTypes.object.isRequired,
        terminalHoverId: PropTypes.string,
        renderModule: PropTypes.func.isRequired,
        renderTerminal: PropTypes.func.isRequired,
        onModulePositionChange: PropTypes.func.isRequired
    },

    getInitialState() {
        return {
            dragging: false
        };
    },

    shouldComponentUpdate: shouldComponentUpdate,

    getCoordinates() {
        const { module } = this.props;
        const { config } = module;
        const { position } = config;
        return position;
    },

    handleMouseDown(event) {
        const [ x, y ] = this.getCoordinates();
        const { clientY, clientX } = event;
        this.startClientX = clientX - x;
        this.startClientY = clientY - y;
        this.handleDragStart(event);
    },

    handleDragStart() {
        css(document.body, { userSelect: 'none' });
        document.addEventListener('mousemove', this.handleDrag);
        document.addEventListener('mouseup', this.handleDragEnd);
        document.onselectstart = () => false;
    },

    handleDrag(event) {
        const { dragging } = this.state;
        if (!dragging) this.setState({ dragging: true });
        const { module, onModulePositionChange } = this.props;
        const { clientX, clientY } = event;
        const x = clientX - this.startClientX;
        const y = clientY - this.startClientY;
        onModulePositionChange({ module, x, y });
    },

    handleDragEnd() {
        css(document.body, { userSelect: '' });
        document.removeEventListener('mousemove', this.handleDrag);
        document.removeEventListener('mouseup', this.handleDragEnd);
        document.onselectstart = undefined;

        setTimeout(() => {
            const { dragging } = this.state;
            if (dragging) this.setState({ dragging: false });
        });
    },

    renderTerminal(terminal) {
        const { renderTerminal, module, terminalHoverId } = this.props;
        const { id } = module;
        const { name } = terminal;
        const terminalId = `${id}.${name}`;
        const hover = terminalHoverId === terminalId;
        return renderTerminal({ terminal, module, hover });
    },

    render() {
        const {
            module,
            terminals,
            renderModule,
            renderTerminal,
            onModulePositionChange,
            ...props
        } = this.props;

        const { dragging } = this.state;
        const [x, y] = this.getCoordinates();
        const terminalsIn = filter(terminals, 'type', 'in');
        const terminalsOut = filter(terminals, 'type', 'out');

        const style = { left: x, top: y };

        return (
            <div
                style={style}
                className={styles.container}
                onMouseDown={this.handleMouseDown}
                {...props}>
                <div className={cn(styles.terminals, styles.terminalsIn)}>
                    {map(terminalsIn, this.renderTerminal)}
                </div>
                <div className={styles.module}>
                    {renderModule({ module, dragging })}
                </div>
                <div className={cn(styles.terminals, styles.terminalsOut)}>
                    {map(terminalsOut, this.renderTerminal)}
                </div>
            </div>
        );
    }
});
