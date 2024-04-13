export interface JobCall<Arg, Result> {
  file: string;
  name: string;
  method?: string;
  args: Array<Arg>;
  _result?: Result;
}

type JobConfig<A, R> = {
  file: string;
  name: string;
  run: (...args: Array<A>) => Promise<R> | R;
};

export class Job<A, R> {
  static create<A, R>(config: JobConfig<A, R>) {
    return new Job(config);
  }

  file: string;
  name: string;
  method: string;
  run: (...args: Array<A>) => Promise<R> | R;

  constructor({ file, name, run }: JobConfig<A, R>) {
    this.file = file;
    this.name = name;
    this.method = 'run';
    this.run = run;
  }
}
