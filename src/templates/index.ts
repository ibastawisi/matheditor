import { EditorDocument } from '../slices/app';
import ComplexSheet from './Complex_Sheet.json';
import FourierAnalysis from './Fourier_Analysis.json';
import RootLocus from './Root_Locus.json';

const templates = {
  [ComplexSheet.id]: ComplexSheet as EditorDocument,
  [FourierAnalysis.id]: FourierAnalysis as EditorDocument,
  [RootLocus.id]: RootLocus as EditorDocument
};

export default templates;
