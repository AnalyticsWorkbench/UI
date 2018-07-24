import React, { PropTypes } from 'react';
import { createForm } from 'react-formalize';
import cn from 'classnames';
import styles from './styles.scss';

const Form = (props) => {
    const { className, ...rest } = props;
    return <form className={cn(className, styles.form)} {...rest}/>;
};

Form.propTypes = {
    className: PropTypes.string
};

export default createForm(Form);
