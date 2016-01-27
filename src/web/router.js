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
					next(err);
					return;
				}

				container.resolve(actionKey, (err, handler) => {
					if (err) {
						next(err);
						return;
					}

					controller.executeHandler(handler);
				});
			});
		};
	}

	templatedGet(controllerPrefix, actionKey, url) {
		function setContent(req, res, next) {
			req.isContentRequest = /\.content$/.test(req.url);
			next();
		}

		this.app.get(url + '(.content)?', setContent, this.middleware(controllerPrefix, actionKey));
	}
}

module.exports = Router;
