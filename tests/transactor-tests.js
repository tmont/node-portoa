import expect from 'expect.js';
import { Transactor } from '../src';
import Sequelize from 'sequelize';
import { Logger } from 'looger';
import { stub } from 'sinon';

describe('Transactor', () => {
	let sequelize;
	const log = Logger.noop;

	beforeEach(() => {
		sequelize = new Sequelize('postgres://foo.bar');
	});
	afterEach(() => {
		sequelize && sequelize.close();
	});

	it('should commit transaction', done => {
		const transactor = new Transactor(sequelize, log);
		const transaction = new Sequelize.Transaction(sequelize);
		const commit = stub(transaction, 'commit').returns(Promise.resolve());
		const rollback = stub(transaction, 'rollback').returns(Promise.resolve());

		stub(sequelize, 'transaction').returns(Promise.resolve(transaction));

		function tx(t, callback) {
			callback(null, 'yarp');
		}

		transactor.transact(tx, (err, result) => {
			expect(err).to.equal(null);
			expect(result).to.equal('yarp');
			expect(commit).to.have.property('callCount', 1);
			expect(rollback).to.have.property('callCount', 0);
			done();
		});
	});

	it('should rollback transaction', done => {
		const transactor = new Transactor(sequelize, log);
		const transaction = new Sequelize.Transaction(sequelize);
		const commit = stub(transaction, 'commit').returns(Promise.resolve());
		const rollback = stub(transaction, 'rollback').returns(Promise.resolve());

		stub(sequelize, 'transaction').returns(Promise.resolve(transaction));

		function tx(t, callback) {
			callback('narp');
		}

		transactor.transact(tx, (err, result) => {
			expect(err).to.equal('narp');
			expect(result).to.be.undefined;
			expect(commit).to.have.property('callCount', 0);
			expect(rollback).to.have.property('callCount', 1);
			done();
		});
	});

	it('should catch error if commit fails', done => {
		const transactor = new Transactor(sequelize, log);
		const transaction = new Sequelize.Transaction(sequelize);
		const commit = stub(transaction, 'commit').returns(Promise.reject('narp'));
		const rollback = stub(transaction, 'rollback').returns(Promise.resolve());

		stub(sequelize, 'transaction').returns(Promise.resolve(transaction));

		function tx(t, callback) {
			callback();
		}

		transactor.transact(tx, (err, result) => {
			expect(err).to.equal('narp');
			expect(result).to.be.undefined;
			expect(commit).to.have.property('callCount', 1);
			expect(rollback).to.have.property('callCount', 0);
			done();
		});
	});

	it('should catch error if rollback fails', done => {
		const transactor = new Transactor(sequelize, log);
		const transaction = new Sequelize.Transaction(sequelize);
		const commit = stub(transaction, 'commit').returns(Promise.resolve());
		const rollback = stub(transaction, 'rollback').returns(Promise.reject('narp1'));

		stub(sequelize, 'transaction').returns(Promise.resolve(transaction));

		function tx(t, callback) {
			callback('narp2');
		}

		transactor.transact(tx, (err, result) => {
			expect(err).to.equal('narp2');
			expect(result).to.be.undefined;
			expect(commit).to.have.property('callCount', 0);
			expect(rollback).to.have.property('callCount', 1);
			done();
		});
	});

	it('should catch error if cannot start transaction', done => {
		const transactor = new Transactor(sequelize, log);
		const transaction = new Sequelize.Transaction(sequelize);
		const commit = stub(transaction, 'commit').returns(Promise.resolve());
		const rollback = stub(transaction, 'rollback').returns(Promise.resolve());

		stub(sequelize, 'transaction').returns(Promise.reject('narp'));

		function tx(t, callback) {
			callback();
		}

		transactor.transact(tx, (err, result) => {
			expect(err).to.equal('narp');
			expect(result).to.be.undefined;
			expect(commit).to.have.property('callCount', 0);
			expect(rollback).to.have.property('callCount', 0);
			done();
		});
	});
});
