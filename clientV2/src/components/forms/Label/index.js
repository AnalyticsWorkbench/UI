import React, { PropTypes, createClass } from 'react';
import cn from 'classnames';

import styles from './styles.scss';

export default createClass({

    displayName: 'Label',

    propTypes: {
        className: PropTypes.string,
        children: PropTypes.node
    },

    render() {
        const { className, ...props } = this.props;
        return (
            <label
                {...props}
                className={cn(className, styles.label)}>
                {this.props.children}
            </label>
        );
    }
});
