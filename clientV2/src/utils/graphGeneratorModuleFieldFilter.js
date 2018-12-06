/* eslint-disable no-else-return */
export default function graphGeneratorModuleFieldFilter(containerObject, selectedValue) {
    const fields = containerObject.fields;
    const letter = selectedValue.split('')[0]; // split a string into an array of substrings, and returns the new array in this case we do for each char FBA6
    return fields.filter((item) => {
        if (item.label.indexOf('[') < 0) {  // this means that we check if the element (array base) with the label of '[' exist !
            return true;
        } else {
            const itemLetters = item.label.split('[')[1].replace(']', '');
            return itemLetters.indexOf(letter) > -1;
        }
    });
}
// if (selectedValue === 'TRUE' || selectedValue === 'FALSE') {
//     debugger;
//     alert("TRUE");
//     return fields;