export enum ReplicationMode {
  /**
   * Use the master database for all operations.
   * This is the default mode.
   */
  MASTER = "master",
  /**
   * Use the slave database for read operations and the master for write operations.
   * This mode is useful for read-heavy applications.
   */
  SLAVE = "slave",
}
