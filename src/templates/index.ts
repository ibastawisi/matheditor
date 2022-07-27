import { EditorDocument } from '../slices/app';
import ComplexSheet from './ComplexSheet.json';
import FourierAnalysis from './FourierAnalysis.json';
import RootLocus from './RootLocus.json';

const templates = {
  [ComplexSheet.id]: ComplexSheet as EditorDocument,
  [FourierAnalysis.id]: FourierAnalysis as EditorDocument,
  [RootLocus.id]: RootLocus as EditorDocument
};

export default templates;
