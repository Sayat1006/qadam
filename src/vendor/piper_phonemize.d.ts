export declare function createPiperPhonemize(opts: {
  print: (line: string) => void;
  printErr: (line: string) => void;
  locateFile: (path: string) => string;
}): Promise<{ callMain: (args: string[]) => void }>;
