/**
 * Types for METL (Model Extract Transform Load)
 */

export interface AlloyModel {
  name: string;
  content: string;
  description: string;
}

export interface ModelConcept {
  name: string;
  description: string;
  relationships: string[];
}

export interface AlloyExample {
  scenario: string;
  alloyCommand: string;
  result: string;
}

export interface GeneratedTest {
  language: string;
  framework: string;
  code: string;
  description: string;
}

export interface ModelingProject {
  name: string;
  targetRepository: string;
  concepts: ModelConcept[];
  model?: AlloyModel;
  examples: AlloyExample[];
  tests: GeneratedTest[];
}
