import path from 'path';
import extend from 'extend';
import hyphenate from '../util/hyphenate';

let jade = null;

try {
	jade = require('jade');
} catch (e) {}

export default class Controller {
	constructor(context, templateOptions) {
		if (!jade) {
			throw new Error('jade module is not available');
		}

		this.context = context;
		this.req = this.context.req;
		this.res = this.context.res;
		this.next = this.context.next;
		this.log = this.context.log;

		this.templateDir = templateOptions.templateDir;
		this.includes = templateOptions.includes || [];
		this.masterPath = templateOptions.masterPath;
		this.jadeOptions = templateOptions.jadeOptions || {};
	}

	setHeader(name, value) {
		this.res.set(name, value);
	}

	getHeader(name) {
		return this.res.get(name);
	}

	setStatus(status) {
		this.res.status(status);
	}

	missingAction(actionKey) {
		const controllerName = this.constructor.name;
		const message = `No action found for ${actionKey} on ${controllerName}`;
		this.render('errors/404', { message: message }, 404);
	}

	json(obj) {
		this.res.json(obj);
	}

	jsonError(message, err, status) {
		if (typeof(err) === 'number') {
			status = err;
			err = null;
		}

		err = err || {};

		if (!message) {
			message = 'An error occurred';
		}

		if (!status) {
			if (err.notFound) {
				status = 404;
			} else if (err.forbidden) {
				status = 403;
			} else if (err.unauthorized) {
				status = 401;
			} else {
				status = 500;
			}
		}

		this.setStatus(status);
		this.json({message: message});
	}

	redirect(url, status) {
		this.res.redirect(url, status || 302);
	}

	render(viewName, params, status) {
		const res = this.res;

		if (typeof(params) === 'number') {
			status = params;
		}
		if (!viewName || typeof(viewName) === 'object') {
			params = viewName;
			viewName = hyphenate(this.context.controllerPrefix || 'default') + '/' +
				hyphenate(this.context.actionKey.toString());
		}

		status = status || 200;
		params = extend({}, params || {});

		Object.keys(res.locals || {}).forEach(function(key) {
			if (!(key in params)) {
				params[key] = res.locals[key];
			}
		});

		function compile(source, filename) {
			return jade.compile(source, extend({
				filename: filename,
				basedir: '/',
				pretty: true,
				compileDebug: false,
				cache: false
			}, self.jadeOptions || {}));
		}

		function compileTemplateWithMaster() {
			const templatePath = path.join(self.templateDir, viewName + '.jade');
			const templateSource = 'extends ' + self.masterPath + '\nblock main-content\n\tinclude ' + templatePath;
			return compile(templateSource, templatePath)(params);
		}

		var self = this;

		function compileTemplate() {
			const templatePath = path.join(self.templateDir, viewName + '.jade');
			const includes = self.includes.map(filename => { return 'include ' + filename; }).join('\n');
			const templateSource = includes + '\ninclude ' + templatePath;
			return compile(templateSource, templatePath)(params);
		}

		this.setStatus(status);

		if (this.req.isContentRequest) {
			this.setHeader('Content-Type', 'application/json');

			let templateHtml;
			try {
				templateHtml = compileTemplate();
			} catch (e) {
				this.log.error('Failed to compile template', e);
				const err = new Error('Failed to compile template: ' + e.message);
				err.code = 'templateCompilation';
				err.thrown = e;
				this.next(err);
				return;
			}

			var response = {
				html: templateHtml,
				meta: params.meta || {}
			};

			this.json(response);
			return;
		}

		this.setHeader('Content-Type', 'text/html');

		let html;
		try {
			html = compileTemplateWithMaster();
		} catch (e) {
			this.log.error('Failed to compile template', e);
			const err = new Error('Failed to compile template: ' + e.message);
			err.code = 'templateCompilation';
			err.thrown = e;
			this.next(err);
			return;
		}

		res.send(html);
	}
}
