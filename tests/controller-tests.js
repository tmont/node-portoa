import expect from 'expect.js';
import { Controller } from '../src';
import { stub } from 'sinon';
import express from 'express';
import { IncomingMessage, ServerResponse } from 'http';

const app = express();

describe('Controller', () => {
	function fakeContext() {
		var req = new IncomingMessage({ encrypted: false });
		req.app = app;
		req.__proto__ = express.request;

		var res = new ServerResponse(req);
		res.__proto__ = express.response;
		res.app = app;

		req.res = res;
		return {
			req: req,
			res: stub(res)
		};
	}

	it('should send json', () => {
		const context = fakeContext();
		const controller = new Controller(context, {});
		controller.json({ foo: 'bar' });
		expect(context.res.json).to.have.property('callCount', 1);
		expect(context.res.json.getCall(0).args).to.eql([ { foo: 'bar' }]);
	});

	it('should redirect', () => {
		const context = fakeContext();
		const controller = new Controller(context, {});
		controller.redirect('/there');
		expect(context.res.redirect).to.have.property('callCount', 1);
		expect(context.res.redirect.getCall(0).args).to.eql([ '/there', 302 ]);
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
		expect(context.res.status.getCall(0).args).to.eql([ 401 ]);
	});

	it('should send json error with status', () => {
		const context = fakeContext();
		const controller = new Controller(context, {});
		controller.jsonError('lol', new Error('foo'), 501);
		expect(context.res.status).to.have.property('callCount', 1);
		expect(context.res.status.getCall(0).args).to.eql([501]);
		expect(context.res.json).to.have.property('callCount', 1);
		expect(context.res.json.getCall(0).args).to.eql([ { message: 'lol' } ]);
	});
});
