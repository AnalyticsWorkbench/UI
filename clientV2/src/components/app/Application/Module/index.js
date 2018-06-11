import every from 'lodash/collection/every';
import cn from 'classnames';
import React, { PropTypes, createClass } from 'react';
import { Scrollbars } from 'react-custom-scrollbars';

import { colorsByFilterCategory } from 'config';
import shouldComponentUpdate from 'utils/shouldComponentUpdate';
import hexToRgb from 'utils/hexToRgb';

import Icon from 'components/ui/Icon';
import Title from './Title';
import Summary from './Summary';
import enhance from './enhance';
import styles from './styles.scss';

const Module = createClass({

    displayName: 'Modules',

    propTypes: {
        dragging: PropTypes.bool.isRequired,
        selected: PropTypes.bool.isRequired,
        lowlight: PropTypes.bool.isRequired,
        module: PropTypes.object.isRequired,
        filter: PropTypes.object.isRequired,
        status: PropTypes.number.isRequired,
        meta: PropTypes.object,
        metaStatus: PropTypes.number,
        metaInput: PropTypes.object,
        isInputModule: PropTypes.bool.isRequired,
        isOutputModule: PropTypes.bool.isRequired,
        workflowActions: PropTypes.object.isRequired,
        className: PropTypes.string
    },

    shouldComponentUpdate: shouldComponentUpdate,

    handleClick() {
        const { module, workflowActions, dragging } = this.props;
        if (dragging) return;
        const { id } = module;
        const { showModule } = workflowActions;
        showModule(id);
    },

    renderFooter() {
        const { meta, metaStatus, metaInput, isInputModule, isOutputModule } = this.props;

        if (isOutputModule) return false;
        let info = <span>No meta data available</span>;

        if (isInputModule) {
            if (metaStatus) info = <span><Icon icon="circle-o-notch" spin/> Analysing input data...</span>;
            if (meta) info = <span>Meta data available</span>;
        } else {
            if (metaInput && every(metaInput, terminal => !!terminal)) info = <span>Meta data available</span>;
        }

        return <div className={styles.footer}>{info}</div>;
    },

    render() {
        const {
            selected,
            lowlight,
            module,
            filter,
            status,
            meta,
            metaStatus,
            metaInput,
            isInputModule,
            isOutputModule,
            workflowActions,
            className,
            ...props
        } = this.props;

        const { id } = module;
        const { name, category } = filter;
        const colors = colorsByFilterCategory[category];
        const { color } = colors;

        const { removeModule, copyModule } = workflowActions;

        const style = {
            ...style,
            opacity: lowlight || status === 1 ? 0.7 : 1,
            boxShadow: selected ? `0 0 0 6px rgba(${hexToRgb(color).join(',')}, 0.4)` : 'none'
        };

        return (
            <div
                style={style}
                className={cn(styles.container, className)}
                onClick={this.handleClick}
                {...props}>
                <Title
                    id={id}
                    name={name}
                    color={color}
                    status={status}
                    removeModule={removeModule}
                    copyModule={copyModule}/>
                <Scrollbars autoHeight>
                    <Summary
                        className={styles.summary}
                        module={module}
                        filter={filter}/>
                </Scrollbars>
                {this.renderFooter()}
            </div>
        );
    }
});

export default enhance(Module);
