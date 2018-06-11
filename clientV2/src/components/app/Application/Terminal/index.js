import cn from 'classnames';
import React, { PropTypes, createClass } from 'react';

import shouldComponentUpdate from 'utils/shouldComponentUpdate';
import { colorsByFilterCategory } from 'config';

import enhance from './enhance';
import styles from './styles.scss';

const Terminal = createClass({

    displayName: 'Terminal',

    propTypes: {
        className: PropTypes.string,
        module: PropTypes.object.isRequired,
        filter: PropTypes.object.isRequired,
        terminal: PropTypes.object.isRequired,
        hover: PropTypes.bool.isRequired
    },

    shouldComponentUpdate: shouldComponentUpdate,

    render() {
        const {
            className,
            module,
            filter,
            terminal,
            hover,
            ...props
        } = this.props;

        const { category } = filter;
        const colors = colorsByFilterCategory[category];
        const { color, shade } = colors;
        const style = { backgroundColor: hover ? color : shade };

        return (
            <div
                style={style}
                className={cn(styles.container, className)}
                {...props}/>
        );
    }
});

export default enhance(Terminal);
