import { DataManager } from "./DataManager";
import TransactionHelper, {
  TransactionHelperOptions,
} from "./TransactionHelper";

describe("transactionHelper", () => {
  let helper: TransactionHelper;
  let dataManagerMock: jest.Mocked<DataManager>;
  let transactionHelperOptionsMock: jest.Mocked<
    TransactionHelperOptions<DataManager>
  >;

  beforeEach(() => {
    dataManagerMock = {
      getTxID: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
    };
    transactionHelperOptionsMock = {
      getDataManager: jest.fn().mockResolvedValue(dataManagerMock),
    };
    helper = new TransactionHelper(transactionHelperOptionsMock);
  });

  it("should start a transaction", async () => {
    await helper.transaction(() => Promise.resolve());
    expect(dataManagerMock.startTransaction).toHaveBeenCalledTimes(1);
  });

  it("should commit a transaction", async () => {
    await helper.transaction(() => Promise.resolve());
    expect(dataManagerMock.commitTransaction).toHaveBeenCalledTimes(1);
  });

  it("should rollback a transaction", async () => {
    await expect(helper.transaction(() => Promise.reject("ERR"))).rejects.toBe(
      "ERR",
    );

    expect(dataManagerMock.rollbackTransaction).toHaveBeenCalledTimes(1);
  });

  it("should release a transaction", async () => {
    await helper.transaction(() => Promise.resolve());
    expect(dataManagerMock.release).toHaveBeenCalledTimes(1);
  });

  it("should create only one DataManager in consecutive transactions", async () => {
    await helper.transaction(async () => {
      await helper.transaction(() => Promise.resolve());
    });

    expect(dataManagerMock.startTransaction).toHaveBeenCalledTimes(1);
  });

  it("should return the same DataManager in consecutive transactions", async () => {
    expect.assertions(3);

    await helper.transaction(async (dm) => {
      await helper.transaction(async (dm2) => {
        expect(dm).toBe(dm2);
        await helper.transaction(async (dm3) => {
          expect(dm2).toBe(dm3);
        });
      });
    });

    expect(transactionHelperOptionsMock.getDataManager).toHaveBeenCalledTimes(
      1,
    );
  });
});
