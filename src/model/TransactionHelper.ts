import { Inject, Injectable, Logger, Scope } from "@nestjs/common";
import { AsyncLocalStorage } from "async_hooks";
import { getTransactionHelperOptionsToken } from "./TransactionHelperOptionsToken";
import { DataManager } from "./DataManager";

export interface TransactionHelperOptions<T extends DataManager> {
  /**
   * Returns the {@link DataManager} instance.
   * This instance can be created according to desired specifications.
   */
  getDataManager(): Promise<T> | T;
}

/**
 * The TransactionHelper is a utility class that helps with managing transactions.
 * It is used to create {@link DataManager} and return the respective {@link DataManager} instance.
 */
@Injectable({ scope: Scope.DEFAULT })
export default class TransactionHelper<T extends DataManager = DataManager> {
  private logger = new Logger(TransactionHelper.name);
  private storage = new AsyncLocalStorage<T>();

  /**
   * Creates a new TransactionHelper
   * @param options The options for the TransactionHelper
   */
  constructor(
    @Inject(getTransactionHelperOptionsToken())
    private options: TransactionHelperOptions<T>,
  ) {}

  /**
   * Returns the stored {@link DataManager} instance in the current scope.
   * @returns The stored {@link DataManager} instance
   */
  public getStoredManager(): ReturnType<(typeof this.storage)["getStore"]> {
    return this.storage.getStore();
  }

  /**
   *
   * Runs a function as a transaction.
   * This function will NOT propagate the transaction to consecutive calls.
   * To
   *
   * @param runInTransaction A function to run
   * @returns The return value of the function
   */
  public async transaction<A>(
    runInTransaction: (manager: T) => Promise<A>,
  ): Promise<A> {
    const [manager, fromStorage] = await this.getDataManager();

    if (!fromStorage) {
      this.logger.verbose("Starting transaction");
      await manager.startTransaction();
      return this.storage.run(manager, () =>
        this.definetelyInAsyncScope<A>(fromStorage, manager, runInTransaction),
      );
    } else {
      return this.definetelyInAsyncScope<A>(
        fromStorage,
        manager,
        runInTransaction,
      );
    }
  }

  private async definetelyInAsyncScope<A>(
    fromStorage: boolean,
    manager: T,
    runInTransaction: (manager: T) => Promise<A>,
  ): Promise<A> {
    try {
      const returnVal = await runInTransaction(manager);

      if (!fromStorage) {
        this.logger.verbose("Committing transaction");
        await manager.commitTransaction();
      }

      return returnVal;
    } catch (e) {
      if (!fromStorage) {
        this.logger.verbose("Rolling back transaction");
        await manager.rollbackTransaction();
      }
      throw e;
    } finally {
      if (!fromStorage) {
        this.logger.verbose("Releasing transaction");
        await manager.release();
      }
    }
  }

  private async getDataManager(): Promise<[T, boolean]> {
    let dm = this.storage.getStore();
    let fromStorage = true;

    if (dm === undefined) {
      this.logger.debug("Creating new data manager");
      dm = await this.options.getDataManager();
      fromStorage = false;
    }

    return [dm, fromStorage];
  }
}
