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
} from "@neohelden/nestjs-server-transactional";

class BookService {
  @Transaction()
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
  getDataManager: async () => {
    return new DataManager();
  },
});
```
