import expect from 'expect.js';
import path from 'path';
import { Controller } from '../src';
import { stub } from 'sinon';
import express from 'express';
import { IncomingMessage, ServerResponse } from 'http';

const app = express();

describe('Controller', () => {
	function fakeContext() {
		const req = new IncomingMessage({encrypted: false});
		req.app = app;
		req.__proto__ = express.request;

		var res = new ServerResponse(req);
		res.__proto__ = express.response;
		res.app = app;

		req.res = res;
		return {
			req: req,
			res: stub(res),
			next: err => {
				throw err;
			},
			controllerPrefix: '',
			actionKey: 'action'
		};
	}

	it('should send json', () => {
		const context = fakeContext();
		const controller = new Controller(context, {});
		controller.json({foo: 'bar'});
		expect(context.res.json).to.have.property('callCount', 1);
		expect(context.res.json.getCall(0).args).to.eql([{foo: 'bar'}]);
	});

	it('should redirect', () => {
		const context = fakeContext();
		const controller = new Controller(context, {});
		controller.redirect('/there');
		expect(context.res.redirect).to.have.property('callCount', 1);
		expect(context.res.redirect.getCall(0).args).to.eql(['/there', 302]);
	});

	it('should redirect with custom status', () => {
		const context = fakeContext();
		const controller = new Controller(context, {});
		controller.redirect('/there', 301);
		expect(context.res.redirect).to.have.property('callCount', 1);
		expect(context.res.redirect.getCall(0).args).to.eql(['/there', 301]);
	});

	it('should set status on response', () => {
		const context = fakeContext();
		const controller = new Controller(context, {});
		controller.setStatus(401);
		expect(context.res.status).to.have.property('callCount', 1);
		expect(context.res.status.getCall(0).args).to.eql([401]);
	});

	it('should send json error with status', () => {
		const context = fakeContext();
		const controller = new Controller(context, {});
		controller.jsonError('lol', new Error('foo'), 501);
		expect(context.res.status).to.have.property('callCount', 1);
		expect(context.res.status.getCall(0).args).to.eql([501]);
		expect(context.res.json).to.have.property('callCount', 1);
		expect(context.res.json.getCall(0).args).to.eql([{message: 'lol'}]);
	});

	describe('rendering', () => {
		it('should render template from content request with includes', () => {
			const basedir = path.join(__dirname, 'files', 'jade');
			const context = fakeContext();
			context.req.isContentRequest = true;
			const controller = new Controller(context, {
				templateDir: path.join(basedir, 'templates'),
				includes: [
					path.join(basedir, 'include1.jade'),
					path.join(basedir, 'include2.jade')
				]
			});

			controller.render('template');
			expect(context.res.json).to.have.property('callCount', 1);
			expect(context.res.set).to.have.property('callCount', 1);
			expect(context.res.set.getCall(0).args).to.eql([ 'Content-Type', 'application/json' ]);
			expect(context.res.json.getCall(0).args[0]).to.eql({
				html: '\n<p>include1</p>\n<p>include2</p>\n<p>this is the template</p>',
				meta: {}
			});
		});

		it('should render template from default view name', () => {
			const basedir = path.join(__dirname, 'files', 'jade');
			const context = fakeContext();
			context.req.isContentRequest = true;
			context.controllerPrefix = 'buzz';
			context.actionKey = 'kill';
			const controller = new Controller(context, {
				templateDir: path.join(basedir, 'templates')
			});

			controller.render();
			expect(context.res.json).to.have.property('callCount', 1);
			expect(context.res.set).to.have.property('callCount', 1);
			expect(context.res.set.getCall(0).args).to.eql(['Content-Type', 'application/json']);
			expect(context.res.json.getCall(0).args[0]).to.eql({
				html: '\n<p>buzzkill</p>',
				meta: {}
			});
		});

		it('should render template from normal request', () => {
			const basedir = path.join(__dirname, 'files', 'jade');
			const context = fakeContext();
			context.req.isContentRequest = false;
			const controller = new Controller(context, {
				templateDir: path.join(basedir, 'templates'),
				masterPath: path.join(basedir, 'master.jade'),
				includes: [
					path.join(basedir, 'include1.jade'),
					path.join(basedir, 'include2.jade')
				]
			});

			controller.render('template');
			expect(context.res.set).to.have.property('callCount', 1);
			expect(context.res.set.getCall(0).args).to.eql(['Content-Type', 'text/html']);
			expect(context.res.send).to.have.property('callCount', 1);
			expect(context.res.send.getCall(0).args[0]).to.eql(
				'\n<html>\n  <body>\n    <p>this is the template</p>\n  </body>\n</html>'
			);
		});
	});
});
