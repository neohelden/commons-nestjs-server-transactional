import {
  Module,
  type DynamicModule,
  type InjectionToken,
  type ModuleMetadata,
  type OptionalFactoryDependency,
  type Provider,
} from "@nestjs/common";
import TransactionHelper, {
  TransactionHelperOptions,
} from "../model/TransactionHelper";
import { DataManager } from "../model/DataManager";
import { getTransactionHelperOptionsToken } from "../model/TransactionHelperOptionsToken";

export type TransactionModuleOptions<T extends DataManager> = {
  /**
   * Whether the module should be global or not
   */
  isGlobal?: boolean;
  /**
   * The options for the TransactionHelper
   */
  transactionHelperOptions: TransactionHelperOptions<T>;
};

export interface TransactionModuleAsyncOptions<T extends DataManager>
  extends Pick<ModuleMetadata, "imports"> {
  useFactory: (
    ...args: never[]
  ) => Promise<TransactionHelperOptions<T>> | TransactionHelperOptions<T>;
  inject?: (InjectionToken | OptionalFactoryDependency)[];
  isGlobal?: boolean;
}

/**
 * A TransactionModule.
 * This module is used to provide the TransactionHelper to the application.
 */
@Module({})
export class TransactionModule {
  static forRoot<T extends DataManager>(
    opts: TransactionModuleOptions<T>,
  ): DynamicModule {
    return {
      module: TransactionModule,
      providers: [
        TransactionHelper,
        {
          provide: getTransactionHelperOptionsToken(),
          useValue: opts.transactionHelperOptions,
        },
      ],
      global: opts.isGlobal,
      exports: [TransactionHelper],
    };
  }

  static forRootAsync<T extends DataManager>(
    opts: TransactionModuleAsyncOptions<T>,
  ): DynamicModule {
    const transactionDiOpts: Provider = {
      provide: getTransactionHelperOptionsToken(),
      useFactory: opts.useFactory,
      inject: opts.inject,
    };
    return {
      global: opts.isGlobal,
      module: TransactionModule,
      imports: opts.imports,
      providers: [TransactionHelper, transactionDiOpts],
      exports: [
        {
          provide: TransactionHelper,
          useClass: TransactionHelper,
        },
      ],
    };
  }
}
