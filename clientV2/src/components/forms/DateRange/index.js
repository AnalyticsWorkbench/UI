import DateRange from 'clientV2/src/components/ui/DateRange';
import { connectInput } from 'react-formalize';

const serialize = value => value;

const mapStateToProps = ({ value, disabled }) => ({
	value: value || {},
    disabled
});

export default connectInput(DateRange, { serialize, mapStateToProps });
