import { useEffect } from "react";
import { MathfieldElement } from "mathlive";
import 'mathlive/dist/mathlive-fonts.css';
import 'mathlive/dist/mathlive.min';

declare global {
  /** @internal */
  namespace JSX {
    interface IntrinsicElements {
      'math-field': React.DetailedHTMLProps<React.HTMLAttributes<MathfieldElement>, MathfieldElement>
    }
  }
}

export function createMathField(value: string, inline: boolean = false): MathfieldElement {
  const mathfield = new MathfieldElement();
  mathfield.virtualKeyboardMode = "onfocus";
  mathfield.virtualKeyboardTheme = "material";
  // eslint-disable-next-line no-useless-escape
  mathfield.mathModeSpace = "\\,"
  mathfield.value = value;
  mathfield.smartMode = true;
  mathfield.keypressSound = "none";
  mathfield.plonkSound = "none";
  inline && (mathfield.style.display = "inline-flex");

  return mathfield;
}

type MathFieldProps = {
  value: string;
  onInput: (value: string) => void;
  mathfieldRef: { current: null | MathfieldElement };
};

export default function MathField({ value, mathfieldRef, onInput }: MathFieldProps): JSX.Element {
  useEffect(() => {
    const mathfield = mathfieldRef.current;
    if (!mathfield) return;
    mathfield.virtualKeyboardMode = "onfocus";
    mathfield.virtualKeyboardTheme = "material";
    // eslint-disable-next-line no-useless-escape
    mathfield.mathModeSpace = "\\,"
    mathfield.smartMode = true;
    mathfield.keypressSound = "none";
    mathfield.plonkSound = "none";

    mathfield.style.display = "inline-flex";
    
    mathfield.oninput = e => onInput(mathfield.value);
    !mathfield.value && mathfield.focus()

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mathfieldRef]);

  useEffect(() => {
    const mathfield = mathfieldRef.current;
    if (!mathfield) return;

    !mathfield.hasFocus() && mathfield.setValue(value, { suppressChangeNotifications: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return <math-field ref={mathfieldRef}>{value}</math-field>
}
