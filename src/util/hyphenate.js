export default function hyphenate(str) {
	if (typeof(str) !== 'string') {
		str = (str || '').toString();
	}

	return str.charAt(0).toLowerCase() + str
		.substring(1)
		.replace(/[A-Z]/g, function(c) {
			return '-' + c.toLowerCase();
		});
}
