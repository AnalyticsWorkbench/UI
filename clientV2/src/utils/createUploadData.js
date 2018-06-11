import after from 'lodash/function/after';
import filter from 'lodash/collection/filter';
import each from 'lodash/collection/each';

function createFileset(module, callback) {
    const { value } = module;
    const { files, text } = value;
    const fileset = [];
    const finalCallback = after(files.length, callback.bind(null, fileset));

    each(files, file => {
        const { name } = file;
        const filetype = name.split('.').pop();
        const reader = new FileReader();
        reader.onload = event => {
            const { target } = event;
            const { result } = target;

            const [specialfiletype, filedata] = !!text
                ? ['TEXT', result]
                : ['BASE64', result.replace(/^[^,]*,/, '')];

            fileset.push({
                filename: name,
                filetype: filetype,
                specialfiletype,
                filedata
            });
            finalCallback();
        };
        if (text) reader.readAsText(file);
        else reader.readAsDataURL(file);
    });
}

export default function createUploadData(options = {}, callback) {
    const {
        workflow,
        filtersById,
        runid
    } = options;

    const { modulesById } = workflow;

    const directUploaders = filter(modulesById, module => {
        const { filterId } = module;
        const f = filtersById[filterId];
        const { name } = f;
        return name === 'Direct Uploader';
    });

    const uploaders = [];
    const finalCallback = after(directUploaders.length, callback.bind(null, uploaders));

    each(directUploaders, module => {
        const { id } = module;
        createFileset(module, fileset => {
            uploaders.push({
                runid: runid,
                instanceid: id,
                pipe: `${id}.out_1`,
                fileset: JSON.stringify(fileset)
            });
            finalCallback();
        });
    });
}
