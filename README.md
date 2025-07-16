# neohelden-commons-nestjs-server-transactional

This module provides a database-agnostic transactional service for NestJS applications.
The transactional service is build in a way, that any underlying database or transaction-supporting service can be used.

## Transaction Bundle

The decisions are available to the Application using decorators.
An example to load the module with TypeORM is:

```typescript
import {
  TransactionHelper,
  Transactional,
  ReplicationMode,
} from "@neohelden/nestjs-server-transactional";

class BookService {
  @Transactional({ replicationMode: ReplicationMode.MASTER })
  async save(book: Book): Promise<Book> {
    repository.save(book);
    return book;
  }
}

class Repository {
  constructor(private readonly helper: TransactionHelper) {}

  @Transactional()
  async save(book: Book): Promise<Book> {
    return helper.transaction(async (dataManager) => {
      dataManager.save(book);
    });
  }
}
```

## Configuration

The configuration of this module is accomplished using NestJS Dynamic modules.
Therefore import the `TransactionModule` in your `AppModule` and provide the configuration.

Example:

```typescript
TransactionModule.forRoot({
  getDataManager: async (replicationMode: ReplicationMode) => {
    // Here you can return a DataManager instance based on the replication mode
    // For example, you might return a master DataManager for MASTER mode
    return new DataManager();
  },
});
```

# Replication Mode

Databases usually support a replication feature. In this system, an operation can either be directed torward a master or a slave database.
This module makes loose assumptions about the underlying database and its replication capabilities.
Therefore, the `ReplicationMode` enum is used to indicate the desired replication mode for a transaction.
The available modes are:

- `MASTER`: The transaction will be executed on the master database.
- `SLAVE`: The transaction will be executed on a slave database.
