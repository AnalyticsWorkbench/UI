export default {
	name: 'Direct Uploader',
	category: 'Input',
	container: {
		outputs: [{
			name: 'out_1',
			label: 'uploaded data'
		}],
		form: {
			files: {
				type: 'File',
				rank: 0,
				label: 'Select a file',
				required: true,
			},
			text: {
				type: 'Checkbox',
				rank: 1,
				label: 'Handle as text',
				default: true,
				description: 'Handle file as text instead as binary'
			}
		},
		descriptionText: 'Handle as tobias ? determines if the data is handled as text or as binary. If the input is a text file (like most network formats), please check it. In doubt please leave it unchecked.',
		legend: 'This agent will upload a file or a data folder from your local file system, please think of the format conversion into a SISOB format.'
	}
};
