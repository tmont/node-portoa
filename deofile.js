module.exports = function(deo) {
	deo
		.setProperty({
			dirs: {
				dist: 'dist',
				src: 'src'
			}
		})
		.targets({
			shell: {
				src: {
					alias: 'compile',
					forever: true,
					command: 'node_modules/.bin/babel',
					args: [
						'--out-dir', '${dirs.dist}',
						'${dirs.src}'
					]
				},
				watch: {
					alias: 'watch',
					forever: true,
					command: 'node_modules/.bin/babel',
					args: [
						'--watch',
						'--out-dir', '${dirs.dist}',
						'${dirs.src}'
					]
				}
			}
		});
};
