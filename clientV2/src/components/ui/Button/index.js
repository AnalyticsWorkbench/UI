import React, { PropTypes } from 'react';
import cn from 'classnames';
import Icon from 'clientV2/src/components/ui/Icon';
import styles from './styles.scss';

class Button extends React.Component {

    renderInner() {
        const { appearance, loading, icon, children, ...props } = this.props;
        return (
            <span className={styles.inner}>
                {loading &&
                <Icon
                    spin
                    icon="circle-o-notch"
                    className={styles.spinner}
                    gradientClassName={styles.spinnerGradient}/>
                }
                {icon && !loading &&
                <Icon icon={icon} className={styles.icon}/>
                }
                {children &&
                <span className={styles.label}>{children}</span>
                }
            </span>
        );
    }
    render() {
        const {
            to,
            href,
            appearance,
            children,
            hideLabelXs,
            ...props
        } = this.props;
        const appearanceClassName = styles['appearance-' + appearance];
        const className = cn(
            styles.button,
            appearanceClassName,
            hideLabelXs && styles.hideLabelXs
        );

        if (href) {
            return (
                <a href={href} {...props} className={className}>
                    {this.renderInner()}
                </a>
            );
        }

        return (
            <button {...props} className={className}>
                {this.renderInner()}
            </button>
        );
    }
}

Button.propTypes = {
    children: PropTypes.node,
    appearance: PropTypes.oneOf(['default', 'highlight']),
    loading: PropTypes.bool,
    icon: PropTypes.string,
    to: PropTypes.string,
    href: PropTypes.string,
    hideLabelXs: PropTypes.bool,

    getDefaultProps() {
        return {
            appearance: 'default'
        }
    }
};


export default Button;
