import cn from 'classnames';
import React, { PropTypes, createClass } from 'react';
import Icon from 'components/ui/Icon';
import shouldComponentUpdate from 'utils/shouldComponentUpdate';

import styles from './styles.scss';

export default createClass({

    displayName: 'Title',

    propTypes: {
        className: PropTypes.string,
        color: PropTypes.string,
        name: PropTypes.string,
        id: PropTypes.number,
        status: PropTypes.number,
        removeModule: PropTypes.func,
        copyModule: PropTypes.func
    },

    shouldComponentUpdate: shouldComponentUpdate,

    handleClickRemove(event) {
        event.stopPropagation();
        const { id, removeModule } = this.props;
        removeModule(id);
    },

    handleClickCopy(event) {
        event.stopPropagation();
        const { id, copyModule } = this.props;
        copyModule(id);
    },

    renderIcon() {
        const { status } = this.props;
        const iconByStatus = {
            0: 'circle',
            1: 'clock-o',
            2: 'circle-o-notch',
            3: 'check',
            5: 'warning'
        };
        const icon = iconByStatus[status];
        return (
            <span className={styles.icon}>
                <Icon icon={icon} spin={status === 2}/>
            </span>
        );
    },

    render() {
        const {
            className,
            color,
            name,
            id,
            ...props
        } = this.props;
        const style = {
            backgroundColor: color
        };

        return (
            <div
                className={cn(className, styles.title)}
                style={style}
                {...props}>
                <div
                    className={styles.name}>
                    {this.renderIcon()}{name} ({id})
                </div>
                <div
                    className={styles.actions}>
                    <div
                        className={styles.action}
                        onClick={this.handleClickCopy}>
                        <Icon icon="copy"/>
                    </div>
                    <div
                        className={styles.action}
                        onClick={this.handleClickRemove}>
                        <Icon icon="times"/>
                    </div>
                </div>
            </div>
        );
    }

});
