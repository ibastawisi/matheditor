import { EditorDocument } from '../slices/app';
import ComplexAnalysis from './ComplexAnalysis.json';
import FourierAnalysis from './FourierAnalysis.json';
import RootLocus from './RootLocus.json';

const templates = {
  [ComplexAnalysis.id]: ComplexAnalysis as EditorDocument,
  [FourierAnalysis.id]: FourierAnalysis as EditorDocument,
  [RootLocus.id]: RootLocus as EditorDocument
};

export default templates;
