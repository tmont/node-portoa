import extend from 'extend';
import Controller from './controller';

export default class Router {
	constructor(app) {
		this.app = app;
	}

	middleware(controllerPrefix, actionKey) {
		return (req, res, next) => {
			const container = req.container;
			if (!container) {
				next(new Error('No container attached to request!'));
				return;
			}

			const log = container.resolveSync('Log');

			function sendError(message) {
				res.status(500);
				if (req.isContentRequest) {
					res.json({message: message});
					return;
				}

				res.send(message);
			}

			const controllerContext = {
				req: req,
				res: res,
				next: next,
				controllerPrefix: controllerPrefix,
				actionKey: actionKey
			};

			container.registerInstance(controllerContext, 'ControllerContext');

			container.resolve(controllerPrefix + 'Controller', (err, controller) => {
				if (err) {
					log.error(err);
					sendError(`No controller found for "${controllerPrefix}"`);
					return;
				}

				const action = controller[actionKey];
				if (typeof(action) !== 'function') {
					controller.missingAction(actionKey);
					return;
				}

				const params = extend({}, req.params, req.query, req.body);
				action.call(controller, params);
			});
		};
	}

	templatedGet(url, controllerPrefix, actionKey) {
		function setContent(req, res, next) {
			req.isContentRequest = /\.content$/.test(req.url);
			next();
		}

		this.app.get(url + '(.content)?', setContent, this.middleware(controllerPrefix, actionKey));
	}
}

module.exports = Router;
