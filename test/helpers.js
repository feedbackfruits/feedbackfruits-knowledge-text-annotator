import test from 'ava';
import * as Helpers from '../lib/helpers';

const captionText = `Let's do a few examples\nmultiplying fractions. So let's multiply\nnegative 7 times 3/49. So you might say, I don't\nsee a fraction here. But you just to remind yourself\nthat the negative 7 can be rewritten as\nnegative 7/1 times 3/49. Now we can multiply\nthe numerators. So the numerator is going\nto be negative 7 times 3. And the denominator is\ngoing to be 1 times 49. And this is going to be\nequal to-- 7 times 3 is 21. And one of their\nsigns is negative, so a negative times a positive\nis going to be a negative. So this is going\nto be negative 21. You could view this as\nnegative 7 plus negative 7 And this is the correct\nvalue, but we can simplify it more because 21 and 49\nboth share 7 as a factor. That's their greatest\ncommon factor. So let's divide\nboth the numerator Divide the numerator and\nthe denominator by 7. And so this gets us\nnegative 3 in the numerator. And in the\ndenominator, we have 7. So we could view it\nas negative 3 over 7. Or, you could even do\nit as negative 3/7. Let's take 5/9 times-- I'll\nswitch colors more in this one. That one's a little monotonous\ngoing all red there. So this is going\nto be equal to-- we And the denominator is\ngoing to be 9 times 15. We could multiply them out,\nbut just leaving it like this you see that there is\nalready common factors in the numerator\nand the denominator. Both the numerator\nand the denominator, they're both divisible\nby 5 and they're both divisible by 3,\nwhich essentially tells us So we can divide the numerator\nand denominator by 15. So divide the\nnumerator by 15, which is just like dividing by\n5 and then dividing by 3. And this is going to be equal\nto-- well, 5 times 3 is 15. Divided by 15 you get\n1 in the numerator. And in the denominator,\n9 times 15 divided by 15. What would negative 5/9\ntimes negative 3/15 be? Well, we've already\nfigured out what positive 5/9 times\npositive 3/15 would be. So now we just have to\ncare about the sign. If we were just multiplying the\ntwo positives, it would be 1/9. But now we have to\nthink about the fact that we're multiplying by a\nnegative times a negative. Now, we remember\nwhen you multiply a negative times a\nnegative, it's a positive. The only way that\nyou get a negative is if one of those two\nnumbers that you're taking the product of\nis negative, not two. If both are positive,\nit's positive. If both are negative,\nit's positive. Let's take 5-- I'm using\nthe number 5 a lot. So let's do 3/2, just\nto show that this would work with\nimproper fractions. And so our numerator is going\nto be 3 times negative 7. And our denominator is\ngoing to be 2 times 10. So this is going to\nbe the numerator. Positive times a\nnegative is a negative. 3 times negative\n7 is negative 21. And you really can't\nsimplify this any further.`;

const concepts = [
  '<http://dbpedia.org/resource/Divisor>',
  '<http://dbpedia.org/resource/Elementary_arithmetic>',
  '<http://dbpedia.org/resource/Greatest_common_divisor>',
  '<http://dbpedia.org/resource/Integer>'
];

test('it exists', t => {
  t.not(Helpers, undefined);
});

// test('textToMedia: it converts text to media', async t => {
//   const result = await Helpers.textToMedia(captionText);
//   return t.deepEqual(result, {});
// });

test('textToConcepts: it converts text to concepts', async t => {
  const result = await Helpers.textToConcepts(captionText);
  return t.deepEqual(result, concepts);
});
