import React, { PropTypes } from 'react';
import { connectMessage } from 'react-formalize';
import cn from 'classnames';

import Label from 'components/forms/Label';
import Icon from 'components/ui/Icon';

import styles from './styles.scss';

const FormGroup = props => {
    const { label, message, className, children, ...rest } = props;
    return (
        <div className={cn(styles.group, className)} {...rest}>
            {label &&
                <Label className={styles.label}>{label}</Label>
            }
            <div className={styles.body}>
                {children}
            </div>
            {message &&
                <div className={styles.message}>
                    <div className={styles.messageColumnIcon}>
                        <Icon padded icon="warning"/>
                    </div>
                    <div className={styles.messageColumnText}>
                        {message}
                    </div>
                </div>
            }
        </div>
    );
};

FormGroup.propTypes = {
    name: PropTypes.string,
    label: PropTypes.string,
    message: PropTypes.oneOfType([
        PropTypes.node,
        PropTypes.object
    ]),
    className: PropTypes.string,
    children: PropTypes.node,
};

export default connectMessage(FormGroup);
