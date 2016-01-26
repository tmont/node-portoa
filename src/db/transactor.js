export default class Transactor {
	constructor(/** Sequelize */sequelize, /** Log */log) {
		this.sequelize = sequelize;
		this.log = log;
	}

	transact(thunk, callback) {
		this.sequelize.transaction()
			.then(t => {
				thunk(t, (err, result) => {
					if (err) {
						this.log.error(err);
						t.rollback()
							.then(() => {
								this.log.warn('Successfully rolled back transaction');
								callback(err);
							})
							.catch(rollbackErr => {
								this.log.error('Error rolling back transaction', rollbackErr);
								callback(err);
							});
						return;
					}

					t.commit()
						.then(() => {
							callback(null, result);
						})
						.catch(err => {
							this.log.error('Error committing transaction', err);
							callback(err);
						});
				});
			})
			.catch(err => {
				this.log.error('Failed to start transaction', err);
				callback(err);
			});
	}
}
