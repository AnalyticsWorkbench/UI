import React, { PropTypes, createClass } from 'react';
import cn from 'classnames';

import styles from './styles.scss';

export default createClass({

    displayName: 'Text',

    propTypes: {
        className: PropTypes.string
    },

    render() {
        const { className, ...props } = this.props;
        return (
            <input
                type="text"
                className={cn(className, styles.input)}
                {...props}/>
        );
    }
});
