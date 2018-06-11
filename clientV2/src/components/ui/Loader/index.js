import React, { createClass, PropTypes } from 'react';
import cn from 'classnames';
import Spinner from 'components/ui/Spinner';
import shouldComponentUpdate from 'utils/shouldComponentUpdate';
import styles from './styles.scss';

export default createClass({

    displayName: 'Loader',

    propTypes: {
        className: PropTypes.string,
        text: PropTypes.node
    },

    shouldComponentUpdate: shouldComponentUpdate,

    render() {
        const { text, className } = this.props;
        return (
            <div className={cn(styles.container, className)}>
                <div className={styles.spinner}>
                    <Spinner gradientClassName={styles.gradientClassName}/>
                </div>
                {text ?
                    <div className={styles.text}>{text}</div>
                    : undefined
                }
            </div>
        );
    }
});
