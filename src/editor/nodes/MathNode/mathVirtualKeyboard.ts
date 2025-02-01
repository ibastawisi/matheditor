"use client";

export const customizeMathVirtualKeyboard = () => {
  if (typeof window === 'undefined') return;
  const mathVirtualKeyboardLayout = [...window.mathVirtualKeyboard.normalizedLayouts];
  // @ts-expect-error
  mathVirtualKeyboardLayout[0].layers[0].rows[1][6] = {
    variants: [
      {
        latex: "\\prod_{#0}^{#0}",
        class: "small"
      },
      "\\otimes",
      "\\cdot"
    ],
    latex: "\\times",
    label: "&times;",
    shift: {
      latex: "\\cdot",
    },
    class: "big-op hide-shift"
  };
  // @ts-expect-error
  mathVirtualKeyboardLayout[0].layers[0].rows[3][9].command = ['performWithFeedback', 'addRowAfter'];
  // @ts-expect-error
  delete mathVirtualKeyboardLayout[0].layers[0].rows[3][9].shift;
  // @ts-expect-error
  mathVirtualKeyboardLayout[1].layers[0].rows[3][8].command = ['performWithFeedback', 'addRowAfter'];
  // @ts-expect-error
  delete mathVirtualKeyboardLayout[1].layers[0].rows[3][8].shift;
  // @ts-expect-error
  mathVirtualKeyboardLayout[2].layers[0].rows.shift();
  // @ts-expect-error
  mathVirtualKeyboardLayout[2].layers[0].rows[3][8].command = ['performWithFeedback', 'addRowAfter'];
  // @ts-expect-error
  delete mathVirtualKeyboardLayout[2].layers[0].rows[3][8].shift;
  // @ts-expect-error
  mathVirtualKeyboardLayout[3].layers[0].rows[3][8].command = ['performWithFeedback', 'addRowAfter'];
  // @ts-expect-error
  delete mathVirtualKeyboardLayout[3].layers[0].rows[3][8].shift;
  // @ts-expect-error
  mathVirtualKeyboardLayout[0].layers[0].rows[2][9].variants = [
    { latex: '\\exists', aside: 'there is' },
    { latex: '\\nexists', aside: 'there isn’t' },

    { latex: '\\ni', aside: 'such that' },
    { latex: '\\Colon', aside: 'such that' },

    { latex: '\\implies', aside: 'implies' },
    { latex: '\\impliedby', aside: 'implied by' },

    { latex: '\\iff', aside: 'if and only if' },

    { latex: '\\land', aside: 'and' },
    { latex: '\\lor', aside: 'or' },
    { latex: '\\oplus', aside: 'xor' },
    { latex: '\\lnot', aside: 'not' },

    { latex: '\\downarrow', aside: 'nor' },
    { latex: '\\uparrow', aside: 'nand' },

    { latex: '\\curlywedge', aside: 'nor' },
    { latex: '\\bar\\curlywedge', aside: 'nand' },

    { latex: '\\therefore', aside: 'therefore' },
    { latex: '\\because', aside: 'because' },

    { latex: '^\\biconditional', aside: 'biconditional' },

    '\\leftrightarrow',
    '\\Leftrightarrow',
    '\\to',
    '\\models',
    '\\vdash',
    '\\gets',
    '\\dashv',
  ];

  // @ts-expect-error
  mathVirtualKeyboardLayout[2].layers[0].rows[3][3].variants = [
    {
      latex: '\\char"203A\\ \\char"2039',
      insert: '\\ ',
      aside: '⅓ em',
    },
    {
      latex: '\\char"203A\\enspace\\char"2039',
      insert: '\\enspace',
      aside: '½ em',
    },
    {
      latex: '\\char"203A\\quad\\char"2039',
      insert: '\\quad',
      aside: '1 em',
    },
    {
      latex: '\\char"203A\\qquad\\char"2039',
      insert: '\\qquad',
      aside: '2 em',
    },
  ];

  // @ts-expect-error
  mathVirtualKeyboardLayout[3].layers[0].rows[3].shift();
  // @ts-expect-error
  mathVirtualKeyboardLayout[3].layers[0].rows[3].splice(3, 0, mathVirtualKeyboardLayout[2].layers[0].rows[3][3]);

  window.mathVirtualKeyboard.layouts = mathVirtualKeyboardLayout;
}