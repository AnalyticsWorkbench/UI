import reduce from 'lodash/collection/reduce';
import map from 'lodash/collection/map';
import cn from 'classnames';
import React, { PropTypes, createClass } from 'react';
import { findDOMNode } from 'react-dom';
import { Scrollbars } from 'react-custom-scrollbars';
import shouldComponentUpdate from 'clientV2/src/utils/shouldComponentUpdate';
import Module from './Module';
import Terminal from './Terminal';
import styles from './styles.scss';

function getBounds(el) {
    const { offsetLeft, offsetTop, offsetWidth, offsetHeight } = el;
    return {
        left: offsetLeft,
        top: offsetTop,
        width: offsetWidth,
        height: offsetHeight
    };
}

export default createClass({

    displayName: 'Stage',

    propTypes: {
        filtersById: PropTypes.object.isRequired,
        modulesById: PropTypes.object.isRequired,
        wiresById: PropTypes.object.isRequired,
        renderModule: PropTypes.func.isRequired,
        renderTerminal: PropTypes.func.isRequired,
        renderWire: PropTypes.func.isRequired,
        onClick: PropTypes.func,
        onModulePositionChange: PropTypes.func.isRequired,
        onWireChange: PropTypes.func.isRequired,
        createWire: PropTypes.func.isRequired,
        removeWire: PropTypes.func.isRequired,
        className: PropTypes.string
    },

    getInitialState() {
        return {
            terminalBoundsById: {},
            temporalWireCoordinatesById: {},
            terminalHoverId: undefined,
            draggingWireId: undefined,
            draggingSrcModuleId: undefined,
            draggingSrcTerminalName: undefined,
            draggingTgtModuleId: undefined,
            draggingTgtTerminalName: undefined,
            draggingReplace: undefined,
            dragging: false,
            creatingWire: false
        };
    },

    componentWillMount() {
        this.terminalRefs = {};
        this.needsUpdate = true;
    },

    componentDidMount() {
        this.setBounds();
    },

    componentWillReceiveProps() {
        this.needsUpdate = true;
    },

    shouldComponentUpdate: shouldComponentUpdate,

    componentDidUpdate() {
        if (this.needsUpdate) {
            this.setBounds();
            this.needsUpdate = false;
        }
    },

    setBounds() {
        const terminalBoundsById = reduce(this.terminalRefs, (acc, component, id) => {
            const node = findDOMNode(component);
            if (node) acc[id] = getBounds(node);
            return acc;
        }, {});
        this.setState({ terminalBoundsById });
    },

    handleClick(event) {
        const { svg } = this.refs;
        const { target } = event;
        if (target !== svg) return;
        const { onClick } = this.props;
        if (onClick) onClick(event);
    },

    handleTerminalDragStart(module, terminal) {
        const { wiresById, createWire } = this.props;
        const { name, type } = terminal;
        const { id: moduleId } = module;

        let creatingWire = false;
        let draggingWireId;
        let draggingSrcModuleId;
        let draggingSrcTerminalName;
        let draggingTgtModuleId;
        let draggingTgtTerminalName;
        let draggingReplace;

        for (const wireId in wiresById) {
            if (!wiresById.hasOwnProperty(wireId)) continue;
            const wire = wiresById[wireId];
            const { src, tgt } = wire;
            const { moduleId: moduleSrcId, terminal: terminalSrc } = src;
            const { moduleId: moduleTgtId, terminal: terminalTgt } = tgt;

            if (moduleSrcId === moduleId && terminalSrc === name) {
                draggingWireId = wireId;
                draggingTgtModuleId = moduleTgtId;
                draggingTgtTerminalName = terminalTgt;
                draggingReplace = 'src';
                break;
            }

            if (moduleTgtId === moduleId && terminalTgt === name) {
                draggingWireId = wireId;
                draggingSrcModuleId = moduleSrcId;
                draggingSrcTerminalName = terminalSrc;
                draggingReplace = 'tgt';
                break;
            }
        }

        if (!draggingWireId) {
            const wireId = reduce(wiresById, (acc, wire, id) => parseInt(id, 10) + 1 > acc ? parseInt(id, 10) + 1 : acc, 1);
            draggingWireId = wireId;
            let src = {};
            let tgt = {};
            if (type === 'in') {
                draggingTgtModuleId = moduleId;
                draggingTgtTerminalName = name;
                draggingReplace = 'src';
                tgt = { moduleId: draggingTgtModuleId, terminal: draggingTgtTerminalName };
            } else {
                draggingSrcModuleId = moduleId;
                draggingSrcTerminalName = name;
                draggingReplace = 'tgt';
                src = { moduleId: draggingSrcModuleId, terminal: draggingSrcTerminalName };
            }
            const wire = { id: wireId, src, tgt };
            creatingWire = true;
            createWire(wire);
        }

        this.setState({
            draggingWireId,
            draggingSrcModuleId,
            draggingSrcTerminalName,
            draggingTgtModuleId,
            draggingTgtTerminalName,
            draggingReplace,
            dragging: true,
            creatingWire
        });
    },

    handleTerminalDrag(module, terminal, event) {
        const node = findDOMNode(this);
        const { left, top } = node.getBoundingClientRect();
        const { draggingWireId, creatingWire } = this.state;

        if (draggingWireId) {
            const { type } = terminal;
            const { clientX, clientY } = event;
            const x = clientX - left;
            const y = clientY - top;

            const wireCoordinates = (type === 'in' && !creatingWire) || (type === 'out' && creatingWire)
                ? { toX: x, toY: y }
                : { fromX: x, fromY: y };

            this.setState({
                temporalWireCoordinatesById: {
                    [draggingWireId]: wireCoordinates
                }
            });
        }
    },

    handleTerminalDragEnd() {
        const { wiresById, onWireChange, removeWire } = this.props;
        const {
            terminalHoverId,
            draggingWireId,
            draggingReplace
        } = this.state;

        const wire = wiresById[draggingWireId];

        if (terminalHoverId) {
            const terminalHoverIdSplitted = terminalHoverId.split('.');
            const [terminalHoverModuleId, terminalHoverName] = terminalHoverIdSplitted;
            const connection = {
                moduleId: parseInt(terminalHoverModuleId, 10),
                terminal: terminalHoverName
            };
            const nextWire = {
                ...wire,
                ...(draggingReplace === 'tgt'
                    ? { tgt: connection }
                    : { src: connection }
                )
            };
            onWireChange(nextWire);
        } else {
            removeWire(wire);
        }

        this.setState({
            temporalWireCoordinatesById: {},
            terminalHoverId: undefined,
            draggingWireId: undefined,
            draggingSrcModuleId: undefined,
            draggingSrcTerminalName: undefined,
            draggingTgtModuleId: undefined,
            draggingTgtTerminalName: undefined,
            draggingReplace: undefined,
            dragging: false,
            creatingWire: false
        });
    },

    canDropWire(draggingWire, srcModuleId, srcTerminalName, tgtModuleId, tgtTerminalName, replace) {
        const { modulesById, filtersById, wiresById } = this.props;
        // Do not allow to connect the module with itself
        if (srcModuleId === tgtModuleId) return false;

        // Check if source module exists
        const srcModule = modulesById[srcModuleId];
        if (!srcModule) return false;
        // The source terminal must be an output
        const { filterId: srcFilterId } = srcModule;
        const srcFilter = filtersById[srcFilterId];
        const srcTerminal = srcFilter.terminals[srcTerminalName];
        const { type: srcTerminalType } = srcTerminal;
        if (srcTerminalType !== 'out') return false;

        // Check if target module exists
        const tgtModule = modulesById[tgtModuleId];
        if (!tgtModule) return false;
        // The target terminal must be an input
        const { filterId: tgtFilterId } = tgtModule;
        const tgtFilter = filtersById[tgtFilterId];
        const tgtTerminal = tgtFilter.terminals[tgtTerminalName];
        const { type: tgtTerminalType } = tgtTerminal;
        if (tgtTerminalType !== 'in') return false;

        // Run through wires, to see if the hovered terminal has already a connected wire
        for (const wireId in wiresById) {
            if (!wiresById.hasOwnProperty(wireId)) continue;
            const wire = wiresById[wireId];
            const { src, tgt } = wire;
            if (replace === 'tgt') {
                const { moduleId, terminal } = tgt;
                // Skip if this is not the terminals module;
                if (tgtModuleId !== moduleId) continue;
                // If the target terminal is the current target terminal, allow the connection
                if (draggingWire === wire) return true;
                // If the new target terminal got a connection, do not allow the connection
                if (tgtTerminalName === terminal) return false;
            } else {
                const { moduleId, terminal } = src;
                // Skip if this is not the terminals module;
                if (srcModuleId !== moduleId) continue;
                // If the source terminal is the current source terminal, allow the connection
                if (draggingWire === wire) return true;
                // If the new source terminal got a connection, do not allow the connection
                if (srcTerminalName === terminal) return false;
            }
        }

        return true;
    },

    handleTerminalMouseMove(module, terminal) {
        const { id } = module;
        const { name } = terminal;
        const terminalId = `${id}.${name}`;
        const { wiresById } = this.props;

        const {
            draggingSrcModuleId,
            draggingSrcTerminalName,
            draggingTgtModuleId,
            draggingTgtTerminalName,
            draggingReplace,
            draggingWireId,
            dragging
        } = this.state;

        if (!dragging) return;
        let canDrop = false;
        const wire = wiresById[draggingWireId];

        if (draggingReplace === 'tgt') {
            canDrop = this.canDropWire(wire, draggingSrcModuleId, draggingSrcTerminalName, id, name, draggingReplace);
        } else if (draggingReplace === 'src') {
            canDrop = this.canDropWire(wire, id, name, draggingTgtModuleId, draggingTgtTerminalName, draggingReplace);
        }

        if (dragging && canDrop) {
            this.setState({ terminalHoverId: terminalId });
        }
    },

    handleTerminalMouseLeave(module, terminal) {
        const { id } = module;
        const { name } = terminal;
        const terminalId = `${id}.${name}`;
        const { dragging, terminalHoverId } = this.state;

        if (dragging && terminalHoverId === terminalId) {
            this.setState({ terminalHoverId: undefined });
        }
    },

    renderThumbHorizontal(props) {
        return <div {...props} className={styles.thumb}/>;
    },

    renderThumbVertical(props) {
        return <div {...props} className={styles.thumb}/>;
    },

    renderModule(module) {
        const {
            filtersById,
            renderModule,
            onModulePositionChange
        } = this.props;

        const { id, filterId } = module;
        const filter = filtersById[filterId];
        const { terminals } = filter;
        const { terminalHoverId } = this.state;

        return (
            <Module
                key={id}
                module={module}
                terminals={terminals}
                terminalHoverId={terminalHoverId}
                renderModule={renderModule}
                renderTerminal={this.renderTerminal}
                onModulePositionChange={onModulePositionChange}/>
        );
    },

    renderTerminal({ terminal, module, ...props }) {
        const { renderTerminal } = this.props;
        const { name } = terminal;
        const { id } = module;
        const terminalId = `${id}.${name}`;

        return (
            <Terminal
                ref={ref => this.terminalRefs[terminalId] = ref}
                key={terminalId}
                module={module}
                terminal={terminal}
                renderTerminal={renderTerminal}
                onDragStart={this.handleTerminalDragStart}
                onDrag={this.handleTerminalDrag}
                onDragEnd={this.handleTerminalDragEnd}
                onMouseMove={this.handleTerminalMouseMove}
                onMouseLeave={this.handleTerminalMouseLeave}
                {...props}/>
        );
    },

    renderWire(wire) {
        const { renderWire, modulesById } = this.props;
        const { terminalBoundsById, temporalWireCoordinatesById } = this.state;
        const { id, src, tgt } = wire;

        const { moduleId: moduleSrcId, terminal: terminalSrc } = src;
        const { moduleId: moduleTgtId, terminal: terminalTgt } = tgt;
        const terminalSrcId = `${moduleSrcId}.${terminalSrc}`;
        const terminalTgtId = `${moduleTgtId}.${terminalTgt}`;

        let moduleSrcX = 0;
        let moduleSrcY = 0;
        const moduleSrc = modulesById[moduleSrcId];
        if (moduleSrc) {
            moduleSrcX = moduleSrc.config.position[0];
            moduleSrcY = moduleSrc.config.position[1];
        }

        let moduleTgtX = 0;
        let moduleTgtY = 0;
        const moduleTgt = modulesById[moduleTgtId];
        if (moduleTgt) {
            moduleTgtX = moduleTgt.config.position[0];
            moduleTgtY = moduleTgt.config.position[1];
        }

        const terminalSrcBounds = terminalBoundsById[terminalSrcId];
        const terminalTgtBounds = terminalBoundsById[terminalTgtId];
        const temporalWireCoordinates = temporalWireCoordinatesById[id];

        const fromX = (temporalWireCoordinates && temporalWireCoordinates.fromX) ||
            (terminalSrcBounds && moduleSrcX + terminalSrcBounds.left + terminalSrcBounds.width) || 0;

        const fromY = (temporalWireCoordinates && temporalWireCoordinates.fromY) ||
            (terminalSrcBounds && moduleSrcY + terminalSrcBounds.top + terminalSrcBounds.height / 2) || 0;

        const toX = (temporalWireCoordinates && temporalWireCoordinates.toX) ||
            (terminalTgtBounds && moduleTgtX + terminalTgtBounds.left) || 0;

        const toY = (temporalWireCoordinates && temporalWireCoordinates.toY) ||
            (terminalTgtBounds && moduleTgtY + terminalTgtBounds.top + terminalTgtBounds.height / 2) || 0;

        if ((fromX === 0 && fromY === 0) || (toX === 0 && toY === 0)) return false;

        return renderWire({
            key: id,
            wire,
            fromX,
            fromY,
            toX,
            toY
        });
    },

    render() {
        const {
            modulesById,
            wiresById,
            renderModule,
            renderWire,
            onClick,
            onModulePositionChange,
            className,
            ...props
        } = this.props;

        return (
            <Scrollbars
                renderThumbHorizontal={this.renderThumbHorizontal}
                renderThumbVertical={this.renderThumbVertical}
                className={cn(styles.container, className)}
                onClick={this.handleClick}
                {...props}>
                <svg ref="svg" className={styles.svg}>
                    {map(wiresById, this.renderWire)}
                </svg>
                {map(modulesById, this.renderModule)}
            </Scrollbars>
        );
    }
});
