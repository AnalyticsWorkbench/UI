import cn from 'classnames';
import map from 'lodash/collection/map';
import React, { PropTypes, createClass } from 'react';

import shouldComponentUpdate from 'utils/shouldComponentUpdate';

import JsonInspector from 'components/ui/JsonInspector';

import styles from './styles.scss';

export default createClass({

    displayName: 'MetaInspector',

    propTypes: {
        meta: PropTypes.object,
        metaInput: PropTypes.object,
        isInput: PropTypes.bool.isRequired,
        isOutput: PropTypes.bool.isRequired,
        className: PropTypes.string,
    },

    shouldComponentUpdate: shouldComponentUpdate,

    isExpanded(keypath) {
        if (keypath.split('.').length) return false;
        return true;
    },

    render() {
        const {
            meta,
            metaInput,
            isInput,
            isOutput,
            className,
            ...props
        } = this.props;

        return (
            <div className={cn(styles.container, className)}>
                {isInput &&
                    <div className={styles.section}>
                        <div className={styles.label}>
                            Meta data this module produces
                        </div>
                        <JsonInspector
                            className={styles.inspector}
                            search={false}
                            isExpanded={this.isExpanded}
                            data={meta}/>
                    </div>
                }
                {!isInput &&
                    map(metaInput, (data, input) => {
                        return (
                            <div className={styles.section} key={input}>
                                <div className={styles.label}>
                                    Meta data comming in at <em>{input}</em>
                                </div>
                                <JsonInspector
                                    className={styles.inspector}
                                    search={false}
                                    isExpanded={this.isExpanded}
                                    data={data}/>
                            </div>
                        );
                    })
                }
            </div>
        );
    }
});
