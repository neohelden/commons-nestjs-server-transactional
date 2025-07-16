import { Inject, Logger } from "@nestjs/common";
import { TransactionHelper } from "../model/TransactionHelper";
import { ReplicationMode } from "../model/ReplicationMode";

export interface TransactionalOptions {
  /**
   * Whether to log the timings of the transaction
   */
  timings?: boolean;

  /**
   * The replication mode to use for the transaction.
   * If not set, the default is MASTER.
   */
  replicationMode?: ReplicationMode;
}

const MICROSECONDS_IN_SECONDS = 1e9;
const MILLISECONDS_IN_SECONDS = 1e6;

export function Transactional(options?: TransactionalOptions): MethodDecorator {
  const logger = new Logger(Transactional.name);
  const inject = Inject(TransactionHelper);

  return function decorate(
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) {
    inject(target, "transactional-helper-" + propertyKey.toString());

    // This function will never be called from this code. We simply wrap it
    // eslint-disable-next-line @typescript-eslint/ban-types
    const originalMethod = descriptor.value as Function;
    const originalName = originalMethod.name;

    descriptor.value = async function (...args: unknown[]) {
      const helper = this[
        "transactional-helper-" + propertyKey.toString()
      ] as TransactionHelper;

      const manager = helper.getStoredManager();
      if (manager !== undefined) {
        logger.verbose(
          "Transactional decorator already has a manager. Using it.",
        );
        return originalMethod.apply(this, args);
      }
      logger.verbose(
        "Transactional decorator does not have a manager. Creating one.",
      );

      let currentTime;
      if (options?.timings) {
        currentTime = process.hrtime();
      }

      try {
        return await helper.transaction(
          () => originalMethod.apply(this, args),
          { replicationMode: options?.replicationMode },
        );
      } catch (e) {
        logger.debug("Error in transactional method", e);
        throw e;
      } finally {
        if (options?.timings) {
          const diff = process.hrtime(currentTime);
          const time = diff[0] * MICROSECONDS_IN_SECONDS + diff[1];
          logger.verbose(
            `Transaction took ${time / MILLISECONDS_IN_SECONDS}ms`,
          );
        }
      }
    };

    Object.defineProperty(descriptor.value, "name", { value: originalName });

    return descriptor;
  };
}
