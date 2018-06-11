import React, { PropTypes, createClass } from 'react';
import cn from 'classnames';

import styles from './styles.scss';

export default createClass({

    displayName: 'File',

    propTypes: {
        className: PropTypes.string
    },

    render() {
        const { className, ...props } = this.props;
        return (
            <input
                multiple
                type="file"
                className={cn(className, styles.input)}
                {...props}/>
        );
    }
});
