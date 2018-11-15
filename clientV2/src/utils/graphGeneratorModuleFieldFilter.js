export default function graphGeneratorModuleFieldFilter(containerObject, selectedValue) {
    const fields = containerObject.fields;
    const letter = selectedValue.split('')[0];

    return fields.filter((item)=>{
        if (item.label.indexOf('[') < 0) {
            return true;
        } else {
            const itemLetters = item.label.split('[')[1].replace(']', '');
            return itemLetters.indexOf(letter) > -1;
        }
    });
};