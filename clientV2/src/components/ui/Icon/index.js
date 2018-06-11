import React, { PropTypes, createClass } from 'react';
import cn from 'classnames';

import styles from './styles.scss';

export default createClass({

    displayName: 'Icon',

    propTypes: {
        icon: PropTypes.string,
        className: PropTypes.string,
        spin: PropTypes.bool,
        padded: PropTypes.bool
    },

    render() {
        const { icon, className, spin, padded, ...props} = this.props;
        return (
            <i {...props}
                className={cn(
                    'fa',
                    'fa-' + icon,
                    spin && 'fa-spin',
                    padded && styles.padded,
                    className
                )}/>
        );
    }
});
