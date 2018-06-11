import css from 'dom-css';
import { PropTypes, createClass } from 'react';
import shouldComponentUpdate from 'utils/shouldComponentUpdate';

export default createClass({

    displayName: 'Terminal',

    propTypes: {
        module: PropTypes.object.isRequired,
        terminal: PropTypes.object.isRequired,
        renderTerminal: PropTypes.func.isRequired,
        onDragStart: PropTypes.func.isRequired,
        onDrag: PropTypes.func.isRequired,
        onDragEnd: PropTypes.func.isRequired,
        onMouseMove: PropTypes.func.isRequired,
        onMouseLeave: PropTypes.func.isRequired,
    },

    shouldComponentUpdate: shouldComponentUpdate,

    handleMouseDown(event) {
        event.stopPropagation();
        this.handleDragStart(event);
    },

    handleMouseMove(event) {
        const { onMouseMove, module, terminal } = this.props;
        onMouseMove(module, terminal, event);
    },

    handleMouseLeave(event) {
        const { onMouseLeave, module, terminal } = this.props;
        onMouseLeave(module, terminal, event);
    },

    handleDragStart(event) {
        const { onDragStart, module, terminal } = this.props;
        css(document.body, { userSelect: 'none' });
        document.addEventListener('mousemove', this.handleDrag);
        document.addEventListener('mouseup', this.handleDragEnd);
        document.onselectstart = () => false;
        onDragStart(module, terminal, event);
    },

    handleDrag(event) {
        const { onDrag, module, terminal } = this.props;
        onDrag(module, terminal, event);
    },

    handleDragEnd() {
        const { onDragEnd, module, terminal } = this.props;
        css(document.body, { userSelect: '' });
        document.removeEventListener('mousemove', this.handleDrag);
        document.removeEventListener('mouseup', this.handleDragEnd);
        document.onselectstart = undefined;
        onDragEnd(module, terminal, event);
    },

    render() {
        const {
            module,
            terminal,
            renderTerminal,
            onDragStart,
            onDrag,
            onDragEnd,
            onMouseMove,
            onMouseLeave,
            ...props
        } = this.props;


        return renderTerminal({
            ...props,
            onMouseMove: this.handleMouseMove,
            onMouseLeave: this.handleMouseLeave,
            onMouseDown: this.handleMouseDown,
            module,
            terminal
        });
    }
});
