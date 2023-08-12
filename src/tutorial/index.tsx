import Task1 from "./Task1.json";
import Task2 from "./Task2.json";
import Task3 from "./Task3.json";
import Task4 from "./Task4.json";
import Task5 from "./Task5.json";
import Task6 from "./Task6.json";
import Task7 from "./Task7.json";
import Checkpoint1 from './Checkpoint1';
import Checkpoint2 from './Checkpoint2';
import Checkpoint3 from './Checkpoint3';
import Checkpoint4 from './Checkpoint4';
import Checkpoint5 from './Checkpoint5';
import Checkpoint6 from './Checkpoint6';
import Checkpoint7 from './Checkpoint7';

import { EditorDocument } from "../types";

export const tasks = [
  Task1 as unknown,
  Task2 as unknown,
  Task3 as unknown,
  Task4 as unknown,
  Task5 as unknown,
  Task6 as unknown,
  Task7 as unknown,
] as EditorDocument[];

export const checkpoints = [
  Checkpoint1,
  Checkpoint2,
  Checkpoint3,
  Checkpoint4,
  Checkpoint5,
  Checkpoint6,
  Checkpoint7,
];
