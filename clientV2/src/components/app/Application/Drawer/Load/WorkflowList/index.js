import map from 'lodash/collection/map';
import cn from 'classnames';
import React, { PropTypes, createClass } from 'react';

import parseCustomDate from 'utils/parseCustomDate';
import shouldComponentUpdate from 'utils/shouldComponentUpdate';
import Icon from 'components/ui/Icon';
import Button from 'components/ui/Button';

import styles from './styles.scss';

export default createClass({

    displayName: 'ResultsList',

    propTypes: {
        workflows: PropTypes.array.isRequired,
        load: PropTypes.func.isRequired,
        destroy: PropTypes.func.isRequired,
        className: PropTypes.string,
    },

    shouldComponentUpdate: shouldComponentUpdate,

    handleDestroyClick(saveid, event) {
        event.stopPropagation();
        const { destroy } = this.props;
        destroy(saveid);
    },

    render() {
        const {
            workflows,
            load,
            destroy,
            className,
            ...props
        } = this.props;

        return (
            <div
                className={cn(styles.container, className)}
                {...props}>
                {map(workflows, (workflow, idx) => {
                    const { saveid, date, description, name, wiring, owned } = workflow;
                    const parsedDate = parseCustomDate(date);
                    const formattedDate = `${parsedDate.toLocaleDateString()} ${parsedDate.toLocaleTimeString()}`;
                    const handleClick = () => load(wiring);
                    const handleDestroyClick = this.handleDestroyClick.bind(this, saveid);
                    return (
                        <div
                            key={idx}
                            className={styles.workflow}
                            onClick={handleClick}>
                            <div className={styles.icon}>
                                <Icon icon="code-fork" padded/>
                            </div>
                            <div className={styles.info}>
                                <div className={styles.name}>
                                    {name}
                                </div>
                                {description &&
                                    <div className={styles.description}>
                                        {description}
                                    </div>
                                }
                                <div className={styles.date}>
                                    {formattedDate}
                                </div>
                            </div>
                            <div className={styles.actions}>
                                {owned &&
                                    <Button icon="trash" onClick={handleDestroyClick}/>
                                }
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    }
});
