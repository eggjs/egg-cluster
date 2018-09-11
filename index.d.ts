import { SecureContextOptions } from 'tls';


/** Cluster Options */
export interface Options {
  /** specify framework that can be absolute path or npm package */
  framework?: string;
  /** directory of application, default to `process.cwd()` */
  baseDir?: string;
  /** customized plugins, for unittest */
  plugins?: object | null;
  /** numbers of app workers, default to `os.cpus().length` */
  workers?: number;
  /** listening port, default to 7001(http) or 8443(https) */
  port?: number;
  /** Ref: https://nodejs.org/api/tls.html#tls_tls_createsecurecontext_options */
  https?: SecureContextOptions;
  [prop: string]: any;
}


export function startCluster(options: Options, callback: (...args: any[]) => any): void;
