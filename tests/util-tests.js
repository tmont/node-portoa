import expect from 'expect.js';
import hyphenate from '../src/util/hyphenate';

describe('Utilities', () => {
	describe('hyphenate', () => {
		it('should hyphenate title-case string', () => {
			expect(hyphenate('FooBar')).to.equal('foo-bar');
		});

		it('should hyphenate camel-case string', () => {
			expect(hyphenate('fooBar')).to.equal('foo-bar');
		});

		it('should do nothing to empty string', () => {
			expect(hyphenate('')).to.equal('');
		});

		it('should coerce non-string value', () => {
			expect(hyphenate(3)).to.equal('3');
			expect(hyphenate(NaN)).to.equal('');
			expect(hyphenate({})).to.equal('[object -object]');
		});

		it('should return empty string for null or undefined', () => {
			expect(hyphenate(null)).to.equal('');
			expect(hyphenate()).to.equal('');
		});
	});
});
