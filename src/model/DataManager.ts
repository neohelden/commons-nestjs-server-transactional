/**
 * A DataManager is an object that manages a transaction. It is used to start, commit, and rollback
 */

import { ReplicationMode } from "./ReplicationMode";

export interface DataManager {
  /**
   * Returns the transaction ID of the current transaction - useful for logging
   */
  getTxID(): Promise<string> | string;
  /**
   * Starts a transaction in the given data manager
   */
  startTransaction(mode: ReplicationMode): Promise<void>;
  /**
   * Commits the transaction in the given data manager.
   * This method is executed after the annotated code is run.
   */
  commitTransaction(): Promise<void>;

  /**
   * Rolls back the transaction in the given data manager.
   * This method is executed if the annotated code throws an error.
   */
  rollbackTransaction(): Promise<void>;
  /**
   * Releases the data manager, allowing it to be garbage collected.
   * Afterward, the data manager should not be used.
   */
  release(): Promise<void>;
}
