import cn from 'classnames';
import React, { PropTypes, createClass } from 'react';
import DayPicker from 'components/ui/DayPicker';
import Button from 'components/ui/Button';

import styles from './styles.scss';

export default createClass({

    displayName: 'DateRange',

    propTypes: {
        min: PropTypes.string,
        max: PropTypes.string,
        value: PropTypes.shape({
            from: PropTypes.string,
            to: PropTypes.string
        }),
        onChange: PropTypes.func.isRequired,
        className: PropTypes.string,
    },

    getDefaultProps() {
        return {
            value: {
                from: undefined,
                to: undefined
            }
        };
    },

    getInitialState() {
        return {
            open: false
        };
    },

    getFromInitialMonth() {
        const { min, value } = this.props;
        const { from } = value;
        if (from) return new Date(from);
        if (min) return new Date(min);
    },

    getToInitialMonth() {
        const { max, value } = this.props;
        const { to } = value;
        if (to) return new Date(to);
        if (max) return new Date(max);
    },

    selectedDaysFrom(date) {
        const { value } = this.props;
        const { from } = value;
        if (from) {
            const fromDate = new Date(from);
            return date >= fromDate;
        }
    },

    selectedDaysTo(date) {
        const { value } = this.props;
        const { to } = value;
        if (to) {
            const toDate = new Date(to);
            return date <= toDate;
        }
    },

    disabledDaysFrom(date) {
        const { min, max, value } = this.props;
        const { to } = value;

        if (to) {
            const toDate = new Date(to);
            if (date > toDate) return true;
        }
        if (min) {
            const minDate = new Date(min);
            minDate.setHours(0, 0, 0, 0);
            if (date < minDate) return true;
        }
        if (max) {
            const maxDate = new Date(max);
            console.log(maxDate, date);
            if (date > maxDate) return true;
        }
    },

    disabledDaysTo(date) {
        const { min, max, value } = this.props;
        const { from } = value;

        if (from) {
            const fromDate = new Date(from);
            if (date < fromDate) return true;
        }
        if (min) {
            const minDate = new Date(min);
            if (date < minDate) return true;
        }
        if (max) {
            const maxDate = new Date(max);
            if (date > maxDate) return true;
        }
    },

    handleFromValueClick() {
        this.setState({ open: 'from' });
    },

    handleToValueClick() {
        this.setState({ open: 'to' });
    },

    handleFromDayClick(event, date) {
        const { value, onChange } = this.props;
        onChange({ ...value, from: date.toISOString() });
        this.setState({ open: 'to' });
    },

    handleToDayClick(event, date) {
        const { value, onChange } = this.props;
        onChange({ ...value, to: date.toISOString() });
        this.setState({ open: false });
    },

    handleReset() {
        const { onChange } = this.props;
        onChange();
        this.setState({ open: false });
    },

    render() {
        const {
            value,
            onChange,
            className,
            ...props
        } = this.props;

        const { from, to } = value;
        const { open } = this.state;

        const pickerFromStyle = open === 'from' ? { display: 'block' } : {};
        const pickerToStyle = open === 'to' ? { display: 'block' } : {};

        return (
            <div className={cn(styles.container, className)}>
                <div className={styles.input}>
                    <label>From</label>
                    <div
                        onClick={this.handleFromValueClick}
                        className={styles.value}>
                        {from ? new Date(from).toLocaleDateString() : 'No date selected'}
                    </div>
                    <div className={styles.picker} style={pickerFromStyle}>
                        <DayPicker
                            initialMonth={this.getFromInitialMonth()}
                            disabledDays={this.disabledDaysFrom}
                            selectedDays={this.selectedDaysFrom}
                            onDayClick={this.handleFromDayClick}/>
                    </div>
                </div>
                <div className={styles.input}>
                    <label>To</label>
                    <div
                        onClick={this.handleToValueClick}
                        className={styles.value}>
                        {to ? new Date(to).toLocaleDateString() : 'No date selected'}
                    </div>
                    <div className={styles.picker} style={pickerToStyle}>
                        <DayPicker
                            initialMonth={this.getToInitialMonth()}
                            disabledDays={this.disabledDaysTo}
                            selectedDays={this.selectedDaysTo}
                            onDayClick={this.handleToDayClick}/>
                    </div>
                </div>
                <div className={styles.actions}>
                    <Button
                        type="button"
                        onClick={this.handleReset}>
                            Reset date range
                    </Button>
                </div>
            </div>
        );
    }

});
