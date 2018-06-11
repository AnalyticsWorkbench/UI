import Slider from 'components/ui/Slider';
import { connectInput } from 'react-formalize';
const serialize = value => value;
export default connectInput(Slider, { serialize });
