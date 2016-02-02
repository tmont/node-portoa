import expect from 'expect.js';
import path from 'path';
import { Router, Controller } from '../src';
import { stub } from 'sinon';
import express from 'express';
import { Container } from 'sahara';
import { Logger } from 'looger';
import http from 'http';

const app = express();

describe('Router', () => {
	let container;
	let app;
	let server;
	let router;
	const port = 9999;

	beforeEach(() => {
		container = new Container()
			.registerInstance(Logger.noop, 'Log');

		app = express();
		app.use((req, res, next) => {
			req.container = container;
			next();
		});

		server = app.listen(port);

		router = new Router(app);
	});

	afterEach(done => {
		if (!server) {
			done();
			return;
		}

		server.close(function() {
			server = null;
			done();
		});
	});

	function sendGetRequest(path, callback) {
		const req = http.get('http://localhost:' + port + path, res => {
			let body = '';
			res.on('data', chunk => {
				body += chunk;
			});
			res.on('end', () => {
				callback(null, body, res);
			});
		});

		req.on('error', callback);
	}

	it('should return 500 error if controller cannot be resolved', done => {
		app.get('/foo', router.middleware('Lol', 'lulz'));
		sendGetRequest('/foo', (err, body, res) => {
			expect(err).to.not.be.ok();
			expect(res.statusCode).to.equal(500);
			expect(body).to.equal('No controller found for "Lol"');
			done();
		});
	});

	it('should delegate to missingAction on controller if action does not exist', done => {
		app.get('/foo', router.middleware('Lol', 'lulz'));

		class LolController extends Controller {
			constructor(/** ControllerContext */context) {
				super(context, {});
			}

			missingAction(actionKey) {
				expect(actionKey).to.equal('lulz');
				this.res.send('yarp');
			}
		}

		container.registerType(LolController);

		sendGetRequest('/foo', (err, body, res) => {
			expect(err).to.not.be.ok();
			expect(body).to.equal('yarp');
			done();
		});
	});

	it('should call action on controller', done => {
		app.get('/foo', router.middleware('Lol', 'lulz'));

		class LolController extends Controller {
			constructor(/** ControllerContext */context) {
				super(context, {});
			}

			lulz(params) {
				expect(params).to.eql({});
				this.res.send('yarp');
			}
		}

		container.registerType(LolController);

		sendGetRequest('/foo', (err, body, res) => {
			expect(err).to.not.be.ok();
			expect(body).to.equal('yarp');
			done();
		});
	});

	it('should call action on controller with params', done => {
		app.get('/foo', router.middleware('Lol', 'lulz'));

		class LolController extends Controller {
			constructor(/** ControllerContext */context) {
				super(context, {});
			}

			lulz({ foo: foo, bar: bar, baz: baz } = {}) {
				expect(foo).to.equal('yarp');
				expect(bar).to.equal('spaz');
				expect(baz).to.equal('3');
				this.res.send('yarp');
			}
		}

		container.registerType(LolController);

		sendGetRequest('/foo?foo=yarp&bar=spaz&baz=3', (err, body, res) => {
			expect(err).to.not.be.ok();
			expect(body).to.equal('yarp');
			done();
		});
	});

	it('should set req.isContentRequest for content requests', done => {
		router.templatedGet('/foo', 'Lol', 'lulz');

		class LolController extends Controller {
			constructor(/** ControllerContext */context) {
				super(context, {});
			}

			lulz() {
				expect(this.req.isContentRequest).to.equal(true);
				this.res.send('yarp');
			}
		}

		container.registerType(LolController);

		sendGetRequest('/foo.content', (err, body, res) => {
			expect(err).to.not.be.ok();
			expect(body).to.equal('yarp');
			done();
		});
	});

	it('should not set req.isContentRequest for non-content requests', done => {
		router.templatedGet('/foo', 'Lol', 'lulz');

		class LolController extends Controller {
			constructor(/** ControllerContext */context) {
				super(context, {});
			}

			lulz() {
				expect(this.req.isContentRequest).to.equal(false);
				this.res.send('yarp');
			}
		}

		container.registerType(LolController);

		sendGetRequest('/foo', (err, body, res) => {
			expect(err).to.not.be.ok();
			expect(body).to.equal('yarp');
			done();
		});
	});
});
