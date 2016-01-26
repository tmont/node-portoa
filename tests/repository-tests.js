import expect from 'expect.js';
import { Repository } from '../src';
import Sequelize from 'sequelize';
import { Logger } from 'looger';
import { stub } from 'sinon';


describe('Repository', () => {
	let sequelize;
	let Foo;
	const log = Logger.noop;

	beforeEach(() => {
		sequelize = new Sequelize('postgres://foo.bar');
		Foo = sequelize.define('foo', {
			id: { type: Sequelize.INTEGER, primaryKey: true }
		});
	});
	afterEach(() => {
		sequelize && sequelize.close();
		Foo = null;
	});

	it('should find by ID successfully', done => {
		const repo = new Repository(Foo, sequelize, log);

		stub(Foo, 'find')
			.withArgs({ where: { id: 7 } })
			.returns(Promise.resolve('yarp'));

		repo.findById(7, (err, result) => {
			expect(err).to.equal(null);
			expect(result).to.equal('yarp');
			done();
		});
	});

	it('should find by ID and return error', done => {
		const repo = new Repository(Foo, sequelize, log);

		stub(Foo, 'find')
			.withArgs({ where: { id: 7 }})
			.returns(Promise.reject('narp'));

		repo.findById(7, (err, result) => {
			expect(err).to.equal('narp');
			expect(result).to.be.undefined;
			done();
		});
	});

	it('should save successfully without columns', done => {
		const repo = new Repository(Foo, sequelize, log);

		var foo = Foo.build();
		stub(foo, 'save')
			.withArgs({ fields: null })
			.returns(Promise.resolve('yarp'));

		repo.save(foo, (err, result) => {
			expect(err).to.equal(null);
			expect(result).to.equal('yarp');
			done();
		});
	});

	it('should save successfully with columns', done => {
		const repo = new Repository(Foo, sequelize, log);

		var foo = Foo.build();
		stub(foo, 'save')
			.withArgs({ fields: [ 'id' ] })
			.returns(Promise.resolve('yarp'));

		repo.save(foo, [ 'id' ], (err, result) => {
			expect(err).to.equal(null);
			expect(result).to.equal('yarp');
			done();
		});
	});

	it('should save and return error', done => {
		const repo = new Repository(Foo, sequelize, log);

		var foo = Foo.build();
		stub(foo, 'save')
			.withArgs({ fields: null })
			.returns(Promise.reject('narp'));

		repo.save(foo, (err, result) => {
			expect(err).to.equal('narp');
			expect(result).to.be.undefined;
			done();
		});
	});

	it('should delete successfully', done => {
		const repo = new Repository(Foo, sequelize, log);

		var foo = Foo.build();
		stub(foo, 'destroy').returns(Promise.resolve('yarp'));

		repo.del(foo, (err, result) => {
			expect(err).to.equal(null);
			expect(result).to.equal('yarp');
			done();
		});
	});

	it('should delete and return error', done => {
		const repo = new Repository(Foo, sequelize, log);

		var foo = Foo.build();
		stub(foo, 'destroy').returns(Promise.reject('narp'));

		repo.del(foo, (err, result) => {
			expect(err).to.equal('narp');
			expect(result).to.be.undefined;
			done();
		});
	});

	it('should run raw query successfully with no options', done => {
		const repo = new Repository(Foo, sequelize, log);

		stub(sequelize, 'query')
			.withArgs('SELECT 1')
			.returns(Promise.resolve([ 'yarp' ]));

		repo.runRawQuery('SELECT 1', (err, result) => {
			expect(err).to.equal(null);
			expect(result).to.equal('yarp');
			done();
		});
	});

	it('should run raw query successfully with options', done => {
		const repo = new Repository(Foo, sequelize, log);

		stub(sequelize, 'query')
			.withArgs('SELECT 1')
			.returns(Promise.resolve([ 'yarp' ]));

		repo.runRawQuery('SELECT 1', {}, (err, result) => {
			expect(err).to.equal(null);
			expect(result).to.equal('yarp');
			done();
		});
	});

	it('should run raw query and return error', done => {
		const repo = new Repository(Foo, sequelize, log);

		stub(sequelize, 'query')
			.withArgs('SELECT 1')
			.returns(Promise.reject('narp'));

		repo.runRawQuery('SELECT 1', (err, result) => {
			expect(err).to.equal('narp');
			expect(result).to.be.undefined;
			done();
		});
	});
});
