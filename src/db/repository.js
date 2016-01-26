export default class Repository {
	constructor(model, sequelize, log) {
		this.model = model;
		this.sequelize = sequelize;
		this.log = log;
		this.models = this.sequelize.models;
	}

	runQueryPromise(promise, callback) {
		promise
			.then(result => {
				callback(null, result);
			})
			.catch(err => {
				this.log.error('SQL error', err);
				callback(err);
			});
	}

	runRawQuery(queryText, options, callback) {
		if (typeof(options) === 'function') {
			callback = options;
			options = null;
		}

		options = options || {};

		var query = this.sequelize.query(queryText, options);
		this.runQueryPromise(query, (err, result) => {
			if (err) {
				callback(err);
				return;
			}

			callback(null, result && result[0]);
		});
	}

	findById(id, callback) {
		var query = this.model.find({
			where: {
				id: id
			}
		});

		this.runQueryPromise(query, callback);
	}

	save(entity, columns, callback) {
		if (typeof(columns) === 'function') {
			callback = columns;
			columns = null;
		}

		var options = {
			fields: columns
		};

		this.runQueryPromise(entity.save(options), callback);
	}

	del(entity, callback) {
		this.runQueryPromise(entity.destroy(), callback);
	}
}
