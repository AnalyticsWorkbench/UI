import React, { PropTypes } from 'react';
import { connectCheckbox } from 'react-formalize';
import cn from 'classnames';

import styles from './styles.scss';

const Checkbox = props => {
    const { label, className, ...rest } = props;
    return (
        <div className={cn(className, styles.container)} {...rest}>
            <label className={styles.wrap}>
                <div className={styles.columnCheckbox}>
                    <input type="checkbox" className={styles.checkbox} {...props}/>
                    <div className={styles.custom}/>
                </div>
                <div className={styles.columnLabel}>
                    {label}
                </div>
            </label>
        </div>
    );
};

Checkbox.propTypes = {
    label: PropTypes.string,
    className: PropTypes.string
};

export default connectCheckbox(Checkbox);
