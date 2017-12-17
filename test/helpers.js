import test from 'ava';
import * as Helpers from '../lib/helpers';

const captionText = `IN4301: Homework Assignment 1\nDeadline: September 17, 2017\n\nExpected results\nFor this exercise we expect a report that is completely written by yourself, in your\nown words, and that contains the answer to the questions in this exercise. Your report\nshould meet the following constraints:\n• It should be at most two sides of an A4 (font size min. 10pt), and in PDF.\n• It should be written in clear, readable, and correct English.\n• It should contain clear references to any existing material or algorithms you used.\n• It should contain your name and student number, the exercise (and if applicable\nversion) number.\n• If you discussed the problem with other student(s), include their names as well\n(but be aware that sharing notes is not allowed).\nSubmit your report through Brightspace before the deadline has passed. The most recent\ndocument submitted before the deadline will be graded.\nAssessment and feedback\nWe will check your report on its\n• correctness,\n• clarity, and\n• completeness with respect to the requirements above.\nYour grade will be given through Brightspace and the feedback on your answers will\nbe written on your report, which you can retrieve from the assistants.\n\nWe consider the following variant of the satisfiability problem.\nSuppose we are given a Boolean formula φ in 3-CNF, containing n literals and\na set C with m clauses, such that all literals are positive (i.e., no negations).\nDoes there exist a truth assignment for φ, such that in each clause exactly\none literal is true?\n1. (1 point) Give a brief explanation of a brute-force algorithm for this problem.\n2. (1 point) Give an analysis of a tight upper bound on this algorithm.\nBelow we ask you to give a search tree algorithm for this problem, branching on the\nvariables.\nGiven is the following proposition.\nProposition 1. If all variables have at most two occurrences, a solution can be found\nin polynomial time through matching.1\nNext we consider some (other) special cases.\n3. (1 point) Prove that if a variable x appears only once and in a clause c ∈ C with\ntwo variables, then c can be removed from the set of clauses.\n4. (1 point) Prove that if C contains a clause c1 = x1 ∨x2 and a clause c2 = x1 ∨x2 ∨x3 ,\nthen x3 has to be put to false.\nGiven here without further proof regarding deciding on a variable x is the following.\nProposition 2. The dominating situation regarding run time in the search tree is\nwhen the total number of other variables in clauses containing x is 3 or less; how to\ndeal with all other cases is given by a function SAT4+(C).\nWe concentrate on a variable x which occurs in three or more clauses (if there is no\nsuch variables, the instance is trivial with the first proposition).\n5. (2 points) Explain what to do if three (or more) clauses contain x, all of size 3.\n6. (2 points) Explain how to derive two subproblems where three variables can be set,\nin case the variable x appears in three clauses with one of them of size two. Assume\nthat the special cases described in questions 3 and 4 have already been dealt with.\n7. (1 point) Give a brief description (or pseudo-code) of an algorithm using all of the\nabove results.\n8. (1 point) Give a tight upper bound on the run time of this algorithm.\n1\nRichard Denman, Stephen Foster, Using clausal graphs to determine the computational complexity\nof -bounded positive one-in-three SAT, Discrete Applied Mathematics, Volume 157, Issue 7, 2009, Pages\n1655-1659.`;

const concepts = [
  { id: '<http://dbpedia.org/resource/Computational_complexity_theory>' },
  { id: '<http://dbpedia.org/resource/Conjunctive_normal_form>' },
  { id: '<http://dbpedia.org/resource/Mathematics>' },
  { id: '<http://dbpedia.org/resource/Boolean_satisfiability_problem>' },
  { id: '<http://dbpedia.org/resource/Algorithm>' },
  { id: '<http://dbpedia.org/resource/Typeface>' },
];

const annotations = [
  {
    "entity": {
      "id": "<http://dbpedia.org/resource/Boolean_satisfiability_problem>"
    },
    "score": 0.9999999999997726,
    "detectedAs": "satisfiability",
    "startPosition": 1226
  },
  {
    "entity": {
      "id": "<http://dbpedia.org/resource/Conjunctive_normal_form>"
    },
    "score": 1,
    "detectedAs": "3-CNF",
    "startPosition": 1294
  },
  {
    "entity": {
      "id": "<http://dbpedia.org/resource/Algorithm>"
    },
    "score": 1,
    "detectedAs": "algorithm",
    "startPosition": 1561
  },
  {
    "entity": {
      "id": "<http://dbpedia.org/resource/Algorithm>"
    },
    "score": 1,
    "detectedAs": "algorithm",
    "startPosition": 1650
  },
  {
    "entity": {
      "id": "<http://dbpedia.org/resource/Algorithm>"
    },
    "score": 1,
    "detectedAs": "algorithm",
    "startPosition": 1700
  },
  {
    "entity": {
      "id": "<http://dbpedia.org/resource/Algorithm>"
    },
    "score": 1,
    "detectedAs": "algorithm",
    "startPosition": 3098
  },
  {
    "entity": {
      "id": "<http://dbpedia.org/resource/Algorithm>"
    },
    "score": 1,
    "detectedAs": "algorithm",
    "startPosition": 3202
  },
  {
    "entity": {
      "id": "<http://dbpedia.org/resource/Computational_complexity_theory>"
    },
    "score": 0.999999996922952,
    "detectedAs": "computational complexity",
    "startPosition": 3285
  },
  {
    "entity": {
      "id": "<http://dbpedia.org/resource/Boolean_satisfiability_problem>"
    },
    "score": 1,
    "detectedAs": "SAT",
    "startPosition": 3344
  }
];

test('it exists', t => {
  t.not(Helpers, undefined);
});
//
// test('textToMedia: it converts text to media', async t => {
//   const result = await Helpers.textToMedia(captionText);
//   return t.deepEqual(result, {});
// });

test('textToConcepts: it converts text to concepts', async t => {
  const result = await Helpers.textToConcepts(captionText);
  return t.deepEqual(result, concepts);
});

test('annotateText: it annotates text with annotations', async t => {
  const result = await Helpers.annotateText(captionText, concepts);
  // console.log(JSON.stringify(result))
  return t.deepEqual(result, annotations);
});
