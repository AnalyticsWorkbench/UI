import File from 'components/ui/File';
import { connectInput } from 'react-formalize';

const serialize = event => {
    const { target } = event;
    const { files } = target;
    return files;
};

const mapStateToProps = ({ disabled }) => ({ disabled });

export default connectInput(File, { serialize, mapStateToProps });
