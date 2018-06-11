import React, { PropTypes, createClass } from 'react';
import cn from 'classnames';
import Icon from 'core/components/ui/Icon';
import styles from './styles.scss';

export default createClass({

    displayName: 'Helper',

    propTypes: {
        children: PropTypes.node,
        icon: PropTypes.string,
        className: PropTypes.string
    },

    render() {
        const { className, icon, ...props } = this.props;
        return (
            <div
                {...props}
                className={cn(className, styles.helper)}>
                {icon ?
                    <div className={styles.columnLeft}>
                        <Icon padded icon={icon}/>
                    </div>
                    : undefined
                }
                <div className={styles.columnRight}>
                    {this.props.children}
                </div>
            </div>
        );
    }
});
